# Testing Boundary

Use the test runner and style already present in the repo. If no test setup exists, the LLM must recommend a current, lightweight, project-fit setup from official docs before adding one.

Test what can break:
- business rules, validation, authorization, state transitions, and error paths
- public APIs, UI flows, integration boundaries, and data contracts touched by the change
- regressions around bugs being fixed
- critical accessibility or responsive behavior when UI is in scope

Do not test framework internals, third-party library behavior, private implementation trivia, or snapshots that only freeze noise.

Tests should describe behavior, keep setup readable, and mock only at real boundaries such as network, filesystem, clock, database, or external services.
