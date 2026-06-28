"""Hermes plugin for Agentic Senior Core."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
SKILLS_DIR = ROOT / "skills"
AGENTS_MD = ROOT / "AGENTS.md"

SKILL_COMMANDS = {
    "asc-refactor": "Structured refactoring workflow with pre-checks and validation.",
    "asc-review": "Production-risk code review with severity-ordered findings.",
    "asc-audit": "Security and architecture audit.",
    "asc-help": "Show available ASC commands.",
}


def _read_agents_md() -> str:
    try:
        return AGENTS_MD.read_text(encoding="utf-8")
    except OSError:
        return ""


def _pre_llm_call(**_: Any) -> dict[str, str] | None:
    content = _read_agents_md()
    return {"context": content} if content else None


def _make_skill_handler(ctx: Any, command: str):
    def handler(raw_args: str) -> str:
        prompt = f"Load and follow the skill `asc:{command}`. {SKILL_COMMANDS[command]}"
        if raw_args and raw_args.strip():
            prompt += f"\n\nUser arguments: {raw_args.strip()}"
        try:
            if ctx.inject_message(prompt):
                return f"Queued `{command}` for the agent."
        except Exception:
            pass
        return prompt
    return handler


def register(ctx: Any) -> None:
    for child in sorted(SKILLS_DIR.iterdir() if SKILLS_DIR.exists() else []):
        skill_md = child / "SKILL.md"
        if child.is_dir() and skill_md.exists():
            ctx.register_skill(child.name, skill_md)

    ctx.register_hook("pre_llm_call", _pre_llm_call)

    for command, description in SKILL_COMMANDS.items():
        ctx.register_command(
            command,
            _make_skill_handler(ctx, command),
            description=description,
            args_hint="[target or notes]",
        )
