Add user registration and login to this Express app.

Requirements:
- POST /api/register — accepts email and password, creates user, returns JWT
- POST /api/login — accepts email and password, validates credentials, returns JWT
- GET /api/me — protected endpoint, returns current user info from JWT
- Store users in a JSON file (users.json) for simplicity
- Include proper password hashing
- Include input validation
- Handle error cases

Make it production-ready.
