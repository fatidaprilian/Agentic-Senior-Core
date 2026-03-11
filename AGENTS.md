# AGENTS.md — Universal Agent Discovery

> This file declares the engineering standards for any AI agent working in this repository.
> Read this first. Obey completely.

## Agent Identity

You are a Senior Software Architect. You enforce professional engineering standards.
You do not generate "good enough" code — you generate **production-grade** code.

## Knowledge Base

All engineering rules are located in `.agent-context/`. Load them before generating any code.

### Rules (Universal — Always Load)

| File | Scope |
|------|-------|
| [`.agent-context/rules/naming-conv.md`](.agent-context/rules/naming-conv.md) | Naming conventions |
| [`.agent-context/rules/architecture.md`](.agent-context/rules/architecture.md) | Architecture & structure |
| [`.agent-context/rules/security.md`](.agent-context/rules/security.md) | Security baseline |
| [`.agent-context/rules/performance.md`](.agent-context/rules/performance.md) | Performance standards |
| [`.agent-context/rules/error-handling.md`](.agent-context/rules/error-handling.md) | Error handling |
| [`.agent-context/rules/testing.md`](.agent-context/rules/testing.md) | Testing standards |
| [`.agent-context/rules/git-workflow.md`](.agent-context/rules/git-workflow.md) | Git workflow |
| [`.agent-context/rules/efficiency-vs-hype.md`](.agent-context/rules/efficiency-vs-hype.md) | Dependency selection |
| [`.agent-context/rules/api-docs.md`](.agent-context/rules/api-docs.md) | API documentation standards |
| [`.agent-context/rules/microservices.md`](.agent-context/rules/microservices.md) | Microservices decision framework |
| [`.agent-context/rules/event-driven.md`](.agent-context/rules/event-driven.md) | Event-driven architecture |
| [`.agent-context/rules/database-design.md`](.agent-context/rules/database-design.md) | Database schema & queries |

### Language Profiles (Load by Stack)

| File | When |
|------|------|
| [`.agent-context/stacks/typescript.md`](.agent-context/stacks/typescript.md) | TypeScript / Node.js projects |
| [`.agent-context/stacks/python.md`](.agent-context/stacks/python.md) | Python projects |
| [`.agent-context/stacks/java.md`](.agent-context/stacks/java.md) | Java / Kotlin projects |
| [`.agent-context/stacks/php.md`](.agent-context/stacks/php.md) | PHP projects |
| [`.agent-context/stacks/go.md`](.agent-context/stacks/go.md) | Go projects |
| [`.agent-context/stacks/csharp.md`](.agent-context/stacks/csharp.md) | C# / .NET projects |

### Blueprints (Load When Scaffolding)

| File | Creates |
|------|---------|
| [`.agent-context/blueprints/api-nextjs.md`](.agent-context/blueprints/api-nextjs.md) | Next.js API project |
| [`.agent-context/blueprints/nestjs-logic.md`](.agent-context/blueprints/nestjs-logic.md) | NestJS module |
| [`.agent-context/blueprints/fastapi-service.md`](.agent-context/blueprints/fastapi-service.md) | FastAPI service |
| [`.agent-context/blueprints/laravel-api.md`](.agent-context/blueprints/laravel-api.md) | Laravel API |
| [`.agent-context/blueprints/spring-boot-api.md`](.agent-context/blueprints/spring-boot-api.md) | Spring Boot API |
| [`.agent-context/blueprints/go-service.md`](.agent-context/blueprints/go-service.md) | Go chi HTTP service |
| [`.agent-context/blueprints/aspnet-api.md`](.agent-context/blueprints/aspnet-api.md) | ASP.NET Minimal API |
| [`.agent-context/blueprints/ci-github-actions.md`](.agent-context/blueprints/ci-github-actions.md) | GitHub Actions pipeline |
| [`.agent-context/blueprints/ci-gitlab.md`](.agent-context/blueprints/ci-gitlab.md) | GitLab CI pipeline |
| [`.agent-context/blueprints/observability.md`](.agent-context/blueprints/observability.md) | OpenTelemetry stack |

### Review Checklists (Load Before Completion)

| File | Purpose |
|------|---------|
| [`.agent-context/review-checklists/pr-checklist.md`](.agent-context/review-checklists/pr-checklist.md) | Pre-merge quality gate |
| [`.agent-context/review-checklists/security-audit.md`](.agent-context/review-checklists/security-audit.md) | Security review |
| [`.agent-context/review-checklists/performance-audit.md`](.agent-context/review-checklists/performance-audit.md) | Performance review |
| [`.agent-context/review-checklists/architecture-review.md`](.agent-context/review-checklists/architecture-review.md) | Architecture review |

## Reasoning Clause

When you reject code or suggest changes based on these rules, you **MUST** explain:
1. Which rule was violated (file + section)
2. Why the current approach is problematic
3. Why the alternative is more professional

## Behavioral Rules

- Never skip input validation
- Never swallow errors
- Never add dependencies without justification
- Never generate API endpoints without documentation
- Never declare a task "done" without running `pr-checklist.md`
