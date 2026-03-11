# Prompt: Initialize Project

> Copy-paste this prompt to your AI agent when starting a new project.
> Replace `[BLUEPRINT]` and `[PROJECT_NAME]` with your values.

---

## The Prompt

```
I want to build [PROJECT_NAME].

Before writing any code:
1. Read ALL files in .agent-context/rules/ to understand our engineering standards.
2. Read .agent-context/stacks/typescript.md for language-specific guidelines.
3. Read .agent-context/blueprints/[BLUEPRINT].md for the project structure.

Now scaffold the initial project structure following the blueprint exactly:
- Create all directories and files from the blueprint
- Set up tsconfig.json with strict mode (all flags from stacks/typescript.md)
- Create .env.example with placeholder values
- Set up Zod-validated environment config
- Set up the error handling foundation (base error class + global handler)
- Set up the logger (pino)
- Create a health check endpoint
- Initialize the ORM with initial schema

Every file MUST follow the naming conventions from rules/naming-conv.md.
Every module MUST follow the architecture from rules/architecture.md.
Every dependency MUST be justified per rules/efficiency-vs-hype.md.
```

## Available Blueprints

| Blueprint | Use When |
|-----------|----------|
| `api-nextjs` | Next.js App Router API project |
| `nestjs-logic` | NestJS backend service |
| `fastapi-service` | Python FastAPI backend service |
| `laravel-api` | PHP Laravel 12 API |
| `spring-boot-api`| Java Spring Boot 4 API |
| `go-service` | Go chi HTTP service |
| `aspnet-api` | C# ASP.NET Minimal API |
| `ci-github-actions`| GitHub Actions CI/CD pipeline |
| `ci-gitlab`      | GitLab CI/CD pipeline |
| `observability`  | OpenTelemetry stack |
