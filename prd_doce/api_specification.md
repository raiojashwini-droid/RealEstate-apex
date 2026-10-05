# API Specification --- Realtor Outreach & Acquisition CRM

## 1. API Standards

**Base:**
`/api/v1`

**Authentication:**
`Authorization: Bearer <access-token>`

**JSON:**
`Content-Type: application/json`

*Every response should include a request/correlation ID, directly or through headers.*

## 2. Standard Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

## 3. Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email"
      }
    ]
  },
  "meta": {
    "requestId": "..."
  }
}
```
*Never expose stack traces, SQL errors, provider secrets or internal credentials.*

## 4. Authentication

`POST /auth/login`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "********"
}
```
**Returns:** 
- access token - refresh/session information - user profile - permissions

**Rules:** 
- generic invalid-credential response - rate limit - do not reveal whether email exists - update lastLoginAt on success

`POST /auth/refresh`
Rotate refresh/session token and return a new access token.

`POST /auth/logout`
Revoke current refresh/session token.

`GET /auth/me`
Return current user and permissions.

`POST /auth/change-password`
Authenticated user changes password.

`POST /auth/forgot-password`
Create a short-lived password-reset flow.

`POST /auth/reset-password`
Consume reset token and update password.

## 5. Users
`GET /users`
Admin only. Filters: - role - status - search

`POST /users`
Admin only.

`GET /users/<id>`
Admin/Manager according to permission.

`PATCH /users/<id>`
Admin only.

`POST /users/<id>/deactivate`
Admin only.
**Transaction:** - deactivate user - preserve history - reassign open leads/deals according to configured rule - audit action

## 6. Contacts
`GET /contacts`
Filters: - status - ownerId - tag - market - source - search - date range
*Use cursor pagination for large datasets.*

`POST /contacts`
Create contact after duplicate checks.

`GET /contacts/<id>`
Return: - profile - owner - tags - cadence - conversation - timeline - active deals

`PATCH /contacts/<id>`
Update allowed fields and create field-level audit records.

`DELETE /contacts/<id>`
Soft delete only.

`POST /contacts/<id>/enroll`
Enroll in cadence.

`POST /contacts/<id>/pause`
Pause cadence.

`POST /contacts/<id>/resume`
Resume cadence if not suppressed/blocked.

`POST /contacts/<id>/do-not-contact`
Permanently block automation.

`POST /contacts/<id>/assign`
Manager/Admin.

`POST /contacts/bulk`
Supported operations: - enroll - pause - tag - change status - assign owner - export
*Bulk operations must be bounded/batched and audited.*

## 7. Imports
`GET /imports/template`
Download CSV template.

`POST /imports/contacts`
Upload CSV.

`POST /imports/<id>/map`
Save column mapping.

`POST /imports/<id>/preview`
Return validation/duplicate preview.

`POST /imports/<id>/commit`
Commit validated rows.

`GET /imports/<id>`
Import status and row-level results.
*No web scraping endpoint is required in this phase.*

## 8. Tags
`GET /tags`
`POST /tags`
`PATCH /tags/<id>`
`DELETE /tags/<id>`
*Deleting a tag should not delete contact history.*

## 9. Templates
`GET /templates`
Filters: - channel - touchNumber - active

`POST /templates`
`GET /templates/<id>`
`PATCH /templates/<id>`
`POST /templates/<id>/versions`
`POST /templates/<id>/preview`
*Preview accepts a real contact ID and returns rendered output without sending.*

## 10. Cadence Settings
`GET /settings/cadence`
Admin/Manager view.

`PATCH /settings/cadence`
Admin only for protected settings.
**Fields:** - intervalDays - sendWindowStart - sendWindowEnd - maxPerChannel24h - providerThrottle
*All changes audited.*

## 11. Conversations
`GET /conversations`
Filters: - automation mode - classification - grade - owner - ageing - hasAddress

`GET /conversations/<id>`
Returns: - contact - messages - AI actions - current grade - grade reasoning - automation mode

`POST /conversations/<id>/takeover`
Human takes control and silences AI.

`POST /conversations/<id>/release-to-ai`
Explicitly returns control to AI, subject to permissions/configuration.

`POST /conversations/<id>/escalate`
Escalate to human queue.

`POST /conversations/<id>/grade/override`
Manual grade override with required reason.

## 12. Messages
`POST /conversations/<id>/messages`
Human manual reply.
*Before send:* - authorization - conversation state - suppression - provider availability - rate limit

`GET /conversations/<id>/messages`
Cursor pagination.

## 13. Webhooks
`POST /webhooks/sms/<provider>`
Inbound SMS/status events.

`POST /webhooks/email/<provider>`
Inbound email/events.

`POST /webhooks/voice/<provider>`
Call events.

**Webhook requirements:** 
- provider signature verification - event deduplication - fast acknowledgement - asynchronous downstream processing

## 14. AI
`POST /ai/conversations/<id>/process`
Internal/admin diagnostic endpoint if exposed; normally worker-only.

`PATCH /settings/ai`
Admin only.
**Settings:** - persona - instructions - thresholds - reply cap - global enabled - escalation threshold
*Never allow clients to send arbitrary system prompts that bypass server safety rules.*

## 15. Deals
`GET /deals`
Filters: - pipeline - stage - owner - grade - source - date

`POST /deals`
Manual deal creation.

`GET /deals/<id>`
Return property, contact, conversation, owner, stage history, notes, attachments and contract documents.

`PATCH /deals/<id>`
Update permitted fields.

`POST /deals/<id>/stage`
Move stage.

`POST /deals/<id>/assign`
Assign/reassign.

`POST /deals/<id>/notes`
Add note.

`POST /deals/<id>/attachments`
Attach file.

`POST /deals/<id>/generate-contract`
Validate fields and create generation job.

## 16. Properties
`GET /properties`
`POST /properties`
`GET /properties/<id>`
`PATCH /properties/<id>`
*Creation must normalize address and check duplicates.*

## 17. Pipelines
`GET /pipelines`
`POST /pipelines`
`PATCH /pipelines/<id>`
`POST /pipelines/<id>/stages`
`PATCH /pipeline-stages/<id>`
`DELETE /pipeline-stages/<id>`
*Stage mutation must respect existing deal history.*

## 18. Calls
`POST /calls`
Log a call.

`GET /calls`
Filters: - contact - deal - user - date - outcome

`POST /calls/click-to-call`
Create provider call request.

## 19. Contracts
`GET /contract-templates`
`POST /contract-templates`
`POST /contract-templates/<id>/mappings`
`PATCH /contract-templates/<id>`
`POST /deals/<id>/generate-contract`
`GET /deals/<id>/contracts`
*Admin manages templates. Manager/Agent can generate according to role rules.*

## 20. Reports
`GET /reports/outreach`
`GET /reports/response-rate`
`GET /reports/grades`
`GET /reports/leads`
`GET /reports/deals`
`GET /reports/team-activity`
`GET /reports/export.csv`
*Large reports should be generated asynchronously when necessary.*

## 21. Notifications
`GET /notifications`
`POST /notifications/<id>/read`
`POST /notifications/read-all`

## 22. Audit
`GET /audit-logs`
Admin/authorized Manager only.
Filters: - actor - action - entity - date range

## 23. Integration Credentials
`GET /settings/integrations`
Return masked provider metadata only.

`POST /settings/integrations`
Admin only.

`PATCH /settings/integrations/<id>`
Admin only.
*Never return secret fields.*

## 24. Health
`GET /health`
Basic API process health.

`GET /health/dependencies`
Authenticated/admin diagnostic endpoint for DB/provider dependency status.
*Do not expose credentials or sensitive infrastructure details publicly.*

## 25. API Validation
Every endpoint must validate: 
- params - query - body - enum values - dates - IDs - pagination - file metadata

*Use a schema validator such as Zod/Joi/Ajv.*

## 26. Authorization Rules
Never authorize based only on frontend route visibility.

**Example:**
Agent `GET /deals/:id`
→ authenticated
→ agent permission
→ deal owner/claim eligibility
→ return

Agent `PATCH /deals/:id/stage`
→ authenticated
→ move-deal permission
→ deal belongs to agent
→ target stage valid
→ transaction

*Manager can reassign. Read-only cannot mutate.*

## 27. Pagination
Preferred: `?limit=50&cursor=<opaque-cursor>`
*Do not expose raw database offsets for high-volume lists when cursor pagination is practical.*

## 28. Idempotency
For mutation endpoints that trigger external effects:
`Idempotency-Key: <client-generated-key>`
*Server stores operation result and returns the same logical result for a repeated key.*

## 29. Error Codes
Suggested stable codes:
- AUTH_INVALID_CREDENTIALS
- AUTH_UNAUTHORIZED
- AUTH_FORBIDDEN
- VALIDATION_ERROR
- NOT_FOUND
- DUPLICATE_CONTACT
- DUPLICATE_PROPERTY
- DO_NOT_CONTACT
- SUPPRESSED_RECIPIENT
- CADENCE_PAUSED
- AI_HUMAN_TAKEOVER
- INVALID_STAGE_TRANSITION
- MISSING_CONTRACT_FIELDS
- PROVIDER_UNAVAILABLE
- RATE_LIMITED
- IDEMPOTENCY_REPLAY
- INTERNAL_ERROR
