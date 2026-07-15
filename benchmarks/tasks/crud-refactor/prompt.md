Refactor this Express CRUD app. It works but is poorly structured:
- Massive single file with repeated patterns
- No input validation
- SQL injection vulnerable (string concatenation in queries)
- No error handling structure
- Mixed concerns (routing, business logic, data access all in one place)

Refactor to be production-safe while keeping all existing functionality. Do not add features — just fix structure, security, and maintainability.
