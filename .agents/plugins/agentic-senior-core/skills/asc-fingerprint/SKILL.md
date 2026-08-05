---
name: asc-fingerprint
description: >
  Trigger this skill when the user says: "map this codebase", "what are our conventions",
  "document our patterns", "onboard to this repo", "fingerprint this repository", or
  "learn this repository structure". Use it before substantial work in an unfamiliar
  repository or when feature research repeatedly rediscovers the same conventions.
---

# Repository Fingerprinting

Extract this repository's actual architectural and procedural conventions before building
anything substantial. The goal is evidence-backed alignment with this codebase, not a
generic architecture score.

## Phase 1: Read-only map

1. Read local instructions and list the active runtime, test, and deployment surfaces.
2. Find two or more analogous modules. Record their layer split, naming, validation,
   error handling, tests, and documentation conventions with file paths.
3. Inspect recent Git history (up to 200 commits, or since the last fingerprint) for
   repeated review corrections, reverts, and release conventions.
4. Read a debt ledger only when it exists. Treat repeated entries as a possible
   convention candidate, not as proof by itself.
5. Report only falsifiable findings. Separate observations from recommendations and
   include the file or commit evidence for every proposed convention.
6. STOP and wait for approval before writing project files.

## Phase 2: Record approved conventions

1. If the target repository already has a project-level `CONVENTIONS.md`, update only
   the approved sections. Otherwise create it at the target repository root.
2. Do not overwrite the ASC package bundle or copy the universal ASC rule into the
   target convention file.
3. Keep each rule short, project-specific, and testable. Record the source evidence
   beside the rule when it would otherwise be ambiguous.
4. Recommend rerunning this skill only when repository structure or repeated feature
   research shows that the document is stale.

## Output

Return:

- factual repository map;
- named analogous modules;
- proposed conventions with evidence;
- a short list of open questions or insufficient evidence.
