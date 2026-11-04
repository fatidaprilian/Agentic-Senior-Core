# Infrastructure, Containers & CI/CD Engineering

Robust infrastructure isolates workloads, prevents credential leakage, scales predictably, and fails gracefully.

---

## 1. Container Architecture & Docker Hygiene

Containers must be minimal, stateless, secure, and reproducible.

### 1.1 Multi-Stage Build Pattern
Separate compilation dependencies from runtime artifacts to produce lightweight, hardened production images:

```dockerfile
# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --production

# Stage 2: Hardened Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as unprivileged non-root user
USER node

# Copy only production artifacts
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 1.2 Container Security Rules
1. **Never run as root:** Always specify `USER node`, `USER 10001:10001`, or an unprivileged system user. Root access inside a container increases the severity of container-escape vulnerabilities.
2. **Zero baked secrets:** Never copy `.env`, private SSH keys, or cloud access tokens into image layers. Pass secrets at runtime via environment variables or secret managers.
3. **Comprehensive `.dockerignore`:** Always ignore `.git`, `node_modules`, `.env*`, test coverage reports, and scratch directories.

---

## 2. 12-Factor Configuration & Startup Validation

Store all configuration in environment variables. Applications must validate configuration at boot time and fail immediately if required values are missing.

### 2.1 Startup Validation Schema
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  API_SECRET_KEY: z.string().min(32),
});

// Fail fast before opening ports or listening to queues
export const env = EnvSchema.parse(process.env);
```

- **Fail Fast:** If `DATABASE_URL` is missing, the application must crash with exit code 1 immediately with a descriptive error. Never start partially and fail on the first incoming user request.

---

## 3. Observability & Health Probes

### 3.1 Separate Liveness and Readiness Probes
Kubernetes and container orchestrators need distinct signals:
- **Liveness Probe (`/healthz`):** Is the process running and not deadlocked? Returns `200 OK`. If failing, the orchestrator restarts the container.
- **Readiness Probe (`/readyz`):** Can the container accept external traffic? Checks database connectivity, cache warming, and migration status. If failing, traffic is redirected without restarting the process.

### 3.2 Structured JSON Logging
Production logs must be formatted as single-line JSON objects to enable ingestion and querying by log aggregators:

```json
{
  "timestamp": "2026-11-04T10:14:02.184Z",
  "level": "info",
  "message": "Deployment completed",
  "trace_id": "c4b9-482a-912b",
  "project_id": "proj_9021",
  "duration_ms": 342
}
```

- Always inject correlation/trace IDs to trace requests across microservices.
- **Never log PII or credentials:** Sanitize passwords, tokens, API keys, and credit card numbers before logging.

---

## 4. Deterministic CI/CD Pipelines

1. **Deterministic Lockfiles:** Always use lockfile-enforced installation (`npm ci`, `poetry install --no-root`, `cargo check --locked`).
2. **Pipeline Caching:** Cache package manager directories (`~/.npm`, `~/.cache/pip`, `~/.cargo`) across pipeline runs.
3. **Fail-Closed Pipelines:** CI must halt immediately upon test failures, linter errors, or type errors. Never permit broken builds to deploy to staging or production.

