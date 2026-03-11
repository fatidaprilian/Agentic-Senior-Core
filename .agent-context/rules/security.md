# Security — Trust Nothing, Validate Everything

> Every user is a potential attacker. Every input is a potential exploit.
> You are not paranoid — you are professional.

## The Zero Trust Input Rule

**ALL data crossing a system boundary is untrusted until validated.**

System boundaries include:
- HTTP request bodies, query params, headers, cookies
- URL path parameters
- File uploads
- WebSocket messages
- Queue/event payloads
- Environment variables (at startup)
- Database query results (yes, even these — data could be corrupted)
- Third-party API responses

### Validation Protocol
```
External Input → Schema Validation (Zod/Pydantic/Bean Validation) → Typed Internal Object

NEVER:
External Input → Direct use in business logic
External Input → Direct use in database query
External Input → Direct interpolation into strings
```

---

## Injection Prevention

### SQL Injection — Parameterized Queries Only
```
❌ DEATH PENALTY:
const query = `SELECT * FROM users WHERE id = ${userId}`;
const query = "SELECT * FROM users WHERE name = '" + name + "'";

✅ ALWAYS:
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = await prisma.user.findUnique({ where: { id: userId } });
```

**Rule:** NEVER concatenate or interpolate user input into SQL strings. Use parameterized queries or ORMs. No exceptions. Not even "just for testing."

### Command Injection
```
❌ DEATH PENALTY:
exec(`convert ${filename} output.png`);

✅ ALWAYS:
execFile('convert', [filename, 'output.png']);
```

**Rule:** Never pass user input to shell commands via string interpolation. Use argument arrays.

### XSS Prevention
```
❌ BANNED:
element.innerHTML = userInput;
dangerouslySetInnerHTML={{ __html: userInput }};

✅ REQUIRED:
element.textContent = userInput;
// Or sanitize with DOMPurify if HTML is absolutely needed
```

**Rule:** Default to text content. Only use HTML injection with explicit sanitization AND a code comment explaining WHY.

---

## Secret Management

### Rule: ZERO Secrets in Code

```
❌ INSTANT REJECTION:
const API_KEY = "sk-abc123def456";
const DB_PASSWORD = "supersecret";
const JWT_SECRET = "my-jwt-secret";
// Even in .env.example with real values

✅ REQUIRED:
const API_KEY = process.env.API_KEY;      // Read from environment
const DB_URL = process.env.DATABASE_URL;   // Injected at runtime
```

### .env Files
- `.env` → NEVER committed (must be in `.gitignore`)
- `.env.example` → Committed with placeholder values ONLY (`API_KEY=your-api-key-here`)
- `.env.local` → NEVER committed
- `.env.test` → May be committed with TEST-ONLY non-secret values

### Secret Rotation
If a secret is accidentally committed:
1. Rotate the secret IMMEDIATELY (not after the PR is merged — NOW)
2. Remove from git history (`git filter-branch` or BFG)
3. Add to `.gitignore`
4. Document the incident

---

## Authentication & Authorization

### Authentication Rules
1. Never implement custom auth crypto — use established libraries (bcrypt, argon2, Passport, NextAuth)
2. Hash passwords with bcrypt (cost ≥ 12) or argon2 — NEVER MD5, SHA1, or plain SHA256
3. Use constant-time comparison for tokens and hashes
4. Implement rate limiting on auth endpoints (max 5 attempts per minute per IP)
5. Session tokens must be cryptographically random (≥ 256 bits)

### Authorization Rules
1. **Default deny** — if no rule grants access, deny
2. **Server-side only** — NEVER trust client-side role checks for security
3. Check authorization at the service layer, not just the controller
4. Log all authorization failures with context (userId, resource, action)

```
❌ BANNED: Client-side only authorization
if (user.role === 'admin') { showDeleteButton(); }
// Attacker just changes user.role in devtools

✅ REQUIRED: Server-side enforcement
// Controller checks auth, service enforces business rules
async deleteUser(requesterId: string, targetUserId: string) {
  const requester = await this.userRepo.findById(requesterId);
  if (!requester || requester.role !== Role.ADMIN) {
    throw new ForbiddenError('Insufficient permissions');
  }
  // ... proceed with deletion
}
```

---

## HTTP Security Headers

Every web application MUST include:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### CORS
- NEVER use `Access-Control-Allow-Origin: *` in production
- Whitelist specific origins
- Be explicit about allowed methods and headers

---

## File Upload Security

1. Validate MIME type server-side (not just file extension)
2. Set maximum file size limits
3. Generate random filenames — never use user-provided filenames
4. Store uploads outside the web root
5. Scan for malware if accepting documents

---

## The Security Checklist (Quick Reference)

Before any code is "done", verify:

- [ ] All inputs validated at boundaries with schemas
- [ ] No string concatenation in queries/commands
- [ ] No secrets in source code
- [ ] Authentication uses established libraries
- [ ] Authorization enforced server-side
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting on sensitive endpoints
- [ ] Error responses don't leak internal details
- [ ] Logging includes security events (login failures, permission denials)
