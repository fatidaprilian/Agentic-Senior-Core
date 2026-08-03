---
name: asc-bootstrap
description: >
  Trigger this skill when the user says: "bootstrap preferences", "set up my preferences", "ui slop wizard", "seed my rules", "init design rules", "run preference onboarding", "onboard slop rules", "start cold start wizard", "set up my style preferences", "customize design rules", "configure how my UI should look", "atur preferensi desain", "konfigurasi gaya ui".
---

# Preference Bootstrap Wizard (`asc-bootstrap`)

Initializes day-one baseline preferences using curated slop patterns (Khroma preference elicitation pattern).

Grounded in: Cold-start preference elicitation literature (Deezer/Netflix) & Khroma explicit onboarding.

## Workflow

1. Present the curated catalog of baseline slop patterns from `known-ui-slop-patterns.json`:
   - `ui-gradient-purple-blue` (Purple-to-blue AI generic gradient)
   - `ui-generic-card-shadcn` (Generic boilerplate card shadow/padding)
   - `ui-inter-font-unpaired` (Unpaired Inter font typography)
   - `ui-colored-left-border` (Colored left-border strip alert/card)
   - `ui-glassmorphism` (Generic glassmorphism backdrop blur)
   - `ui-pill-badge-generic` (Generic rounded pill tag badge)
2. Prompt user to select which slop patterns to ban for their brand/repo.
3. Call `bootstrapPreferences()` in `lib/core/bootstrap-wizard.mjs` to seed selected rules into project preferences.
4. Auto-compile Track A rules into `.git/hooks/pre-commit` and `ascx validate`.
