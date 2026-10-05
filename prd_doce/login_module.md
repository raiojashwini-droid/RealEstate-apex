# Login & Authentication Module

## 1. Purpose

This module provides secure login and server-side authorization for Admin, Manager, Agent and Read-only users.

Authentication is foundational. Every other module depends on the authenticated user identity and permission model.

## 2. Roles

- ADMIN
- MANAGER
- AGENT
- READ_ONLY

*Do not use role strings from the frontend as trusted authorization data.*

## 3. User Table

Minimum fields:
- id
- email
- passwordHash
- firstName
- lastName
- role
- status
- lastLoginAt
- createdAt
- updatedAt
- deactivatedAt

**Constraints:** 
- normalized email must be unique 
- passwordHash must never be returned 
- deactivated accounts cannot authenticate 
- history is retained after deactivation

## 4. Password Policy

**Recommended:** 
- minimum 12 characters 
- password hash using Argon2id or bcrypt with a strong cost 
- never store plaintext passwords 
- never log passwords 
- never return password fields 
- rate-limit failed login attempts

## 5. Session Model

**Use:** 
- short-lived access token 
- refresh token/session record

*Store only a hash of refresh tokens.*

**Session fields:**
- id
- userId
- tokenHash
- expiresAt
- revokedAt
- lastUsedAt
- ipAddress
- userAgent
- createdAt

## 6. Login Flow

`POST /api/v1/auth/login`
        ↓
Validate email/password
        ↓
Find active user
        ↓
Verify password hash
        ↓
Create session/refresh token
        ↓
Issue access token
        ↓
Update lastLoginAt
        ↓
Return user + permissions

**Failure:** 
- return generic invalid-credentials error 
- do not disclose whether account exists 
- increment rate-limit/security counters

## 7. Access Token

**Recommended claims:**
```json
{
  "sub": "user-id",
  "sessionId": "session-id",
  "iat": 0,
  "exp": 0
}
```

*Do not put sensitive profile data or mutable permission sets into a long-lived token.*

## 8. Middleware

**authMiddleware**
Responsibilities: 
1. extract bearer token 
2. verify signature 
3. verify expiry 
4. resolve session 
5. verify session is not revoked 
6. load user 
7. verify user is active 
8. attach authenticated principal to request

**permissionMiddleware**
Checks the endpoint permission.

**recordAuthorization**
Checks ownership/record state for Agent-level actions.

## 9. Permission Codes

**Suggested:**
- users.read
- users.write
- users.deactivate
- contacts.read
- contacts.write
- contacts.bulk
- contacts.assign
- contacts.enroll
- contacts.export
- conversations.read
- conversations.reply
- conversations.takeover
- conversations.escalate
- deals.read
- deals.write
- deals.move
- deals.assign
- contracts.generate
- contracts.templates.manage
- reports.read
- settings.read
- settings.write
- integrations.manage
- audit.read

*Roles map to permissions in server configuration or a dedicated role-permission table.*

## 10. API

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`
- `POST /api/v1/auth/change-password`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

## 11. Login Request

```json
{
  "email": "admin@example.com",
  "password": "strong-password"
}
```

## 12. Login Response

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    },
    "permissions": [
      "users.read",
      "users.write"
    ]
  }
}
```

*Do not return refresh token in JSON if the chosen browser architecture uses an HttpOnly Secure SameSite cookie. If cookies are used, add CSRF protection.*

## 13. Logout

Logout must revoke the current session/refresh token. A stolen access token remains valid only for its short lifetime.

## 14. Password Reset

**Flow:**
Forgot password
  ↓
Create short-lived random reset token
  ↓
Store only token hash
  ↓
Email reset link
  ↓
User submits new password
  ↓
Verify token
  ↓
Update password hash
  ↓
Revoke existing sessions

*Do not reveal whether an email is registered.*

## 15. User Deactivation

**When Admin deactivates a user:** 
1. mark status DEACTIVATED 
2. revoke sessions 
3. preserve audit/history 
4. identify open leads/deals 
5. reassign them using configured assignment logic 
6. log every reassignment

## 16. Security Requirements

- HTTPS/TLS
- secure password hashing
- rate limiting
- generic auth errors
- secure session revocation
- token rotation
- input validation
- audit logging
- no secret values in logs
- no password/token fields in API responses
- strict CORS
- secure cookie flags if cookies are used

## 17. Common Backend Mistakes to Avoid

- Checking role only in React.
- Accepting ownerId from an Agent and trusting it.
- Allowing deactivated users to use old sessions indefinitely.
- Storing raw refresh tokens.
- Returning password hashes.
- Logging authorization headers.
- Using one long-lived JWT with all permissions embedded.
- Forgetting rate limits on login/reset.
- Forgetting to revoke sessions after password reset.
- Allowing Read-only users to hit mutation endpoints directly.

## 18. Acceptance Tests

- valid Admin can log in
- invalid password is rejected
- deactivated user is rejected
- expired access token is rejected
- revoked session cannot refresh
- Agent cannot modify another Agent's deal
- Manager can reassign
- Read-only cannot mutate
- Admin can manage users/settings
- password reset invalidates previous sessions
- sensitive credentials never appear in response/logs
