# Project Constraints & Coding Conventions

## ASC Decision Ladder Alignment
- Step 1: Does this need to be built at all?
- Step 2: Does the codebase already have this?
- Step 3: Does standard library cover it?
- Step 4: Does an installed dependency cover it?
- Step 5: Can this be one straightforward function?
- Step 6: Minimum working code only.

## Code Quality & Security Constraints
- Strict input validation at trust boundaries.
- No custom crypto or duplicate helper utilities.
- Descriptive naming & early returns over deep nesting.
