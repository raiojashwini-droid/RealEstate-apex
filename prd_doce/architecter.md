# Backend Architecture --- Realtor Outreach & Acquisition CRM

## 1. Target Stack

- **Runtime:** Node.js
- **HTTP API:** Express.js
- **Language:** TypeScript recommended
- **ORM:** Prisma
- **Database:** MySQL
- **Authentication:** short-lived JWT access token + refresh-token/session mechanism
- **Background processing:** durable job queue backed by MySQL/Redis depending on infrastructure
- **Email:** provider adapter
- **SMS/voice:** Twilio or Telnyx adapter
- **AI:** provider adapter
- **File storage:** object storage
- **Documents:** template rendering service
- **Deployment:** separate API and worker processes

## 2. Architecture Principles

- Controllers contain HTTP concerns only.
- Services contain business rules.
- Repositories/data-access contain Prisma queries.
- Providers are hidden behind interfaces.
- Workers perform delayed/retryable work.
- Database transactions protect state transitions.
- Every external send has an idempotency key.
- Authorization is enforced before business actions.
- Configuration is stored in database, not hard-coded.
- Audit events are emitted for significant mutations.
- External provider failure must not corrupt core CRM state.
- AI is never allowed to bypass human-control states.

## 3. Suggested Project Structure

```text
src/
  app.ts
  server.ts
  config/
  middleware/
    auth.middleware.ts
    permission.middleware.ts
    validation.middleware.ts
    error.middleware.ts
    request-id.middleware.ts
  modules/
    auth/
    users/
    contacts/
    imports/
    cadence/
    templates/
    messaging/
    conversations/
    ai/
    grading/
    routing/
    properties/
    deals/
    pipelines/
    calls/
    contracts/
    notifications/
    settings/
    integrations/
    audit/
    reports/
  providers/
    sms/
    email/
    ai/
    storage/
    document/
  jobs/
    cadence/
    messaging/
    ai/
    grading/
    reports/
  prisma/
  utils/
```

## 4. Request Flow

**Browser/PWA**
   ↓
**Express Router**
   ↓
**Authentication Middleware**
   ↓
**Permission/Record Authorization**
   ↓
**Request Validation**
   ↓
**Controller**
   ↓
**Service**
   ↓
**Prisma Repository / Transaction**
   ↓
**MySQL**

*External work:*
Service → Outbox/Job → Worker → Provider Adapter → Provider
                                      ↓
                              webhook/event
                                      ↓
                                Webhook API
                                      ↓
                              message/event service

## 5. Authentication Boundary

Every protected API request: 
1. parse access token 
2. validate signature and expiry 
3. load active user/session 
4. verify account status 
5. attach authenticated principal 
6. check endpoint permission 
7. check record ownership/state where required

Never trust userId, role, ownerId or similar authorization fields from the request body.

## 6. Authorization Matrix

| Capability | Admin | Manager | Agent | Read-only |
| :--- | :--- | :--- | :--- | :--- |
| Users/roles | CRUD | View | No | No |
| Credentials | CRUD | No secret access | No | No |
| Contacts | CRUD | CRUD | Own/claim | Read |
| Bulk contact actions | Yes | Yes | Limited/own | No |
| Conversations | All | All | Own/assigned | Read |
| Reassign leads | Yes | Yes | No | No |
| Pipeline settings | Yes | View | No | No |
| Move deals | Yes | Yes | Own deals | No |
| Generate contracts | Yes | Yes | Yes | No |
| Contract templates | CRUD | View | No | No |
| Reports | All | All | Own/relevant | Read |
| Audit logs | All | View | No | No |

Exact permissions should be represented as permission codes in code/config, while role assignments remain database data.

## 7. Contact Lifecycle

Imported/Created
      ↓
ACTIVE_IN_OUTREACH
      ↓
RESPONDED / ESCALATED
      ↓
Deal created → cadence paused
      ↓
Terminal deal
      ↓
ACTIVE_IN_OUTREACH

**Permanent exits:**
OPTED_OUT
DO_NOT_CONTACT
DECLINED

## 8. Cadence Engine

The scheduler must not simply scan every contact every minute.

**Recommended process:** 
1. Enrollment creates a next-run timestamp. 
2. Scheduler finds due enrollments. 
3. It locks/claims a batch. 
4. It verifies contact status, suppression, deal state, sending window and rate limit. 
5. It creates outbound message jobs. 
6. Worker sends via provider. 
7. Successful send updates last-contacted and next-run time. 
8. Failure records retry metadata. 
9. Idempotency prevents duplicate sends.

Use database locking/claim fields so two workers cannot dispatch the same touch.

## 9. Messaging Abstraction

**Interfaces:**

`SmsProvider`
  - send()
  - getMessageStatus()
  - handleInboundWebhook()
  - handleDeliveryWebhook()

`EmailProvider`
  - send()
  - getMessageStatus()
  - handleInboundWebhook()
  - handleEventWebhook()

`VoiceProvider`
  - initiateCall()
  - handleInboundCall()
  - getCallStatus()

The application must not call Twilio/Telnyx directly from controllers.

## 10. Webhooks

**Webhook processing:** 
1. authenticate/verify provider signature 
2. store raw event ID 
3. reject duplicate event IDs 
4. map provider event to internal event 
5. update message/call status 
6. create timeline event 
7. trigger downstream work if applicable

Never trust provider payloads without signature verification.

## 11. AI Flow

Inbound SMS
   ↓
Webhook verified
   ↓
Message stored
   ↓
Conversation state loaded
   ↓
Suppression/opt-out check
   ↓
Human takeover check
   ↓
AI context builder
   ↓
AI classification + structured extraction
   ↓
Persist AI result
   ↓
Grade conversation
   ↓
Routing rules
   ├── Address → Property + Deal + Round Robin
   ├── Needs Human → Queue + Round Robin
   ├── Opt-out → Suppression
   └── Continue → AI reply job

AI output must be schema-validated before any side effect.

## 12. AI Control States

Conversation automationMode: 
- AI_ACTIVE 
- HUMAN_ACTIVE 
- AI_PAUSED 
- ESCALATED 
- CLOSED

Only explicit application actions may return HUMAN_ACTIVE/ESCALATED to AI_ACTIVE.

## 13. Round Robin

Maintain: 
- participant list 
- active/inactive state 
- current cursor 
- assignment history

Assignment must run transactionally: 
1. lock routing configuration 
2. choose next active participant 
3. advance cursor 
4. create assignment log 
5. commit 
6. notify assignee

Deactivated users are skipped without losing historical assignments.

## 14. Deal State Machine

Stage changes must validate: 
- source/target stage exists 
- actor has permission 
- loss reason is supplied for terminal loss stages 
- duplicate lead has original deal 
- terminal stage timestamp is stored 
- cadence resume is triggered only after successful transaction

## 15. Contract Generation

Document generation should be asynchronous for large files: 
1. validate required fields 
2. create generation record 
3. enqueue job 
4. render template 
5. produce PDF + DOCX 
6. store files 
7. create version record 
8. attach to deal 
9. notify user

Never overwrite an existing generated document.

## 16. Audit Architecture

Audit significant actions: 
- actor 
- action 
- entity type 
- entity ID 
- timestamp 
- request ID 
- changed fields 
- old/new values where permitted 
- IP/user-agent where appropriate

Sensitive credentials must never appear in audit payloads.

## 17. Reliability

Required patterns: 
- idempotency keys 
- retry with backoff 
- dead-letter/failed-job state 
- provider timeouts 
- circuit-breaker or failure isolation 
- webhook deduplication 
- transaction boundaries 
- health checks 
- structured logs 
- alerting

## 18. Performance

For 250k contacts: 
- indexed status/owner/next-run timestamps 
- cursor pagination for large lists 
- server-side filtering/sorting 
- avoid N+1 Prisma queries 
- background exports 
- background imports 
- background report generation 
- selective relation loading

Do not use findMany() without pagination for large contact/deal lists.

## 19. Configuration

Store in DB: 
- cadence interval 
- send windows 
- throttles 
- AI persona 
- AI thresholds 
- AI reply cap 
- grade criteria/weights 
- pipelines/stages 
- loss reasons 
- tags/status definitions 
- round-robin participants

Environment variables are for infrastructure secrets/config, not business rules.

## 20. Failure Isolation

If SMS provider fails: 
- CRM contacts/deals remain usable 
- failed SMS job is retried 
- Admin receives alert 
- email can continue

If AI provider fails: 
- inbound message is preserved 
- conversation is marked AI pending/error 
- human queue can take over 
- no message is lost

## 21. Security

- TLS
- strong password hashing
- refresh-token/session rotation
- secure cookies if browser session architecture uses cookies
- CSRF protection where applicable
- rate limiting
- request validation
- SQL injection protection through Prisma
- output encoding
- upload validation
- least privilege
- encrypted integration secrets
- secret values never returned by API
- audit logs
- backup encryption
- webhook signature verification

## 22. Deployment

Recommended separate processes:
- web/API process
- worker process
- scheduler process
- MySQL
- object storage
- optional Redis
- monitoring/logging

The scheduler should create jobs; workers should execute them. This prevents a slow external provider from blocking normal API requests.
