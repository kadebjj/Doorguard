# DoorGuard — Test Credentials

> Auth: JWT-based custom auth (email + password). Backend: `/api/auth/login`, `/api/auth/register`.

## Test Client (with emergency contact + SOS history seeded via testing)
- Email: `client_sft_1781136145@test.com`
- Password: `Test1234!`
- Role: client

## Existing Trainer (password unknown — register fresh trainers for testing)
- Email: `trainer1@test.com`
- Role: trainer
- Note: password not stored; create a new trainer account if trainer login is needed.

## How to create fresh accounts
Register via `POST /api/auth/register` with body:
`{"email","password","full_name","role":"client"|"trainer","city"}`

Use unique emails (append timestamp) to avoid 400 "Email already registered".
