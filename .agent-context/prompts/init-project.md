# Prompts: Initialize Project

> Copy-paste one of these prompts to your AI agent (Cursor, Windsurf, Copilot, Antigravity) right after cloning this repository.
> V1.4 rekomendasi: jalankan `npx @ryuenn3123/agentic-senior-core init` untuk compile strict AI coding guidelines (Federated Governance baseline).

---

## Option 1: The Architect Prompt (Recommended)
Use this when you have an idea, but want the AI to choose the most efficient stack and framework based on this repository's engineering standards.

```text
I want to build a [DESCRIBE YOUR PROJECT AND MAIN FEATURES HERE].

Context: You are a Principal Software Architect operating in a workspace with strict engineering standards.

Step 1: Context Gathering
1. Read `AGENTS.md` to understand your role and available knowledge base.
2. Scan all files in `.agent-context/rules/` to understand our mandatory engineering laws.
3. Review dynamic stack and architecture signals from project docs, repository evidence, and task constraints.

Step 2: Architecture Proposal
Based strictly on my project description and our repository's existing rules (especially `efficiency-vs-hype.md`):
1. Propose the most efficient technology stack based on requirements and evidence.
2. Explain WHY this stack is the best choice for this specific project.
3. Draft a high-level architecture plan.

Do not write any application code yet. Write your proposal and wait for my approval. Once I approve, you will scaffold the project using the selected architecture playbook.
```

---

## Option 2: The Direct Blueprint Prompt
Use this when you already know exactly which framework you want to use from the available blueprints.

```text
I want to build [PROJECT NAME].

Before writing any code:
1. Read `AGENTS.md` to understand your role.
2. Read ALL files in `.agent-context/rules/` to understand our engineering standards.
3. Resolve language-specific guidance from dynamic stack signals.
4. Resolve the project structure from the selected architecture playbook.

Now scaffold the initial project structure following the blueprint exactly:
- Create all directories and files from the blueprint
- Set up the environment config and validation (e.g., Zod, Pydantic, FluentValidation)
- Set up the error handling foundation (base error class + global handler)
- Set up the logger
- Create a health check endpoint
- Initialize the ORM/Database connection


Setiap file harus mengikuti [naming conventions](../.agent-context/rules/naming-conv.md).
Setiap modul harus mengikuti [architecture.md](../.agent-context/rules/architecture.md).
Setiap dependency harus justified sesuai [efficiency-vs-hype.md](../.agent-context/rules/efficiency-vs-hype.md).
```

---

## Referensi Stacks & Blueprints

Lihat [docs/roadmap.md](../docs/roadmap.md) dan [docs/deep-dive.md](../docs/deep-dive.md) untuk daftar stack/blueprint terbaru.

---

## Bootstrap UI/UX (DESIGN.md)

Untuk memulai desain UI/UX dari nol, gunakan prompt [bootstrap-design.md](./bootstrap-design.md) agar AI langsung membangunkan Art Director digital Anda.
