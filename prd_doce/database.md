# Database Specification --- MySQL + Prisma

## 1. Database Rules

**Database:** MySQL.

**ORM:** Prisma.

- **Primary keys:** UUID strings are recommended for externally exposed records.
- Every table has `createdAt` and `updatedAt` where applicable.
- **Soft-deletable business records:** use `deletedAt`; do not hard-delete contacts/deals that have history.
- **Foreign keys:** use explicit relations.
- **All timestamps:** are stored in UTC.
- Recipient timezone is stored separately for contact-level scheduling.
- **Unique constraints:** are used for natural duplicate keys.
- **Provider IDs and webhook event IDs:** are indexed and deduplicated.

## 2. Core Enums

**UserRole:**
- ADMIN
- MANAGER
- AGENT
- READ_ONLY

**UserStatus:**
- ACTIVE
- DEACTIVATED

**ContactStatus:**
- ACTIVE_IN_OUTREACH
- RESPONDED
- ESCALATED
- DECLINED
- OPTED_OUT
- DO_NOT_CONTACT

**ConversationAutomationMode:**
- AI_ACTIVE
- HUMAN_ACTIVE
- AI_PAUSED
- ESCALATED
- CLOSED

**MessageChannel:**
- EMAIL
- SMS

**MessageDirection:**
- INBOUND
- OUTBOUND

**MessageSenderType:**
- HUMAN
- AI
- SYSTEM

**InboundClassification:**
- INTERESTED
- NOT_INTERESTED
- HAS_PROPERTY
- QUESTION
- WANTS_CALL
- OPT_OUT
- UNCLEAR

**PipelineType:**
- STANDARD
- AI_INBOUND

**DealStatus:**
- OPEN
- WON
- LOST
- PARKED
- DUPLICATE

**DealSource:**
- MANUAL
- AI_INBOUND

**JobStatus:**
- PENDING
- PROCESSING
- SUCCEEDED
- FAILED
- DEAD_LETTER
- CANCELLED

## 3. User

**Purpose:** authenticated application users.
**Fields:** id - email - passwordHash - firstName - lastName - role - status - lastLoginAt - createdAt - updatedAt - deactivatedAt
**Indexes:** unique email - status - role
**Rules:** never return passwordHash - deactivation keeps history - open assignments are reassigned by service transaction

## 4. AuthSession / RefreshToken

**Fields:** id - userId - tokenHash - expiresAt - revokedAt - createdAt - lastUsedAt - ipAddress - userAgent
**Indexes:** userId - expiresAt - revokedAt
*Never store raw refresh tokens.*

## 5. Contact

**Fields:** id - fullName - licenseNumber nullable - brokerage nullable - email nullable - normalizedEmail nullable - mobilePhone nullable - normalizedMobilePhone nullable - mobileCapable boolean - market default DFW - timezone - status - source - cadenceStartAt nullable - lastContactedAt nullable - lastResponseAt nullable - ownerId nullable - doNotContact boolean - deletedAt nullable - createdAt - updatedAt
**Indexes:** normalizedEmail - normalizedMobilePhone - licenseNumber - status - ownerId - next cadence lookup via enrollment table
**Duplicate matching:** email - phone - license number - application-level normalized matching - do not rely only on case-sensitive raw values

## 6. ContactNote

**Fields:** id - contactId - authorId - body - createdAt - updatedAt - deletedAt

## 7. Tag / ContactTag

**Tag:** id - name - description - isActive - createdAt - updatedAt
**ContactTag:** contactId - tagId - createdAt
**Unique:** (contactId, tagId)

## 8. ContactFieldAudit

**Fields:** id - contactId - actorId nullable for system - fieldName - oldValue - newValue - changedAt - requestId
*Do not store secrets in old/new values.*

## 9. CadenceSettings

**Fields:** id - intervalDays default 30 - sendWindowStart - sendWindowEnd - maxAutomatedPerChannelPer24h - providerThrottlePerMinute - enabled - updatedById - updatedAt

## 10. CadenceEnrollment

**Fields:** id - contactId - status - cadenceStartAt - lastTouchAt - lastReplyAt - nextTouchAt - touchNumber - pausedAt - pauseReason - resumedAt - createdAt - updatedAt
**Unique:** contactId
**Indexes:** nextTouchAt - status - contactId
*This table is the scheduler's source of truth.*

## 11. OutreachTemplate

**Fields:** id - channel - name - touchNumber - subject nullable - body - isActive - createdById - updatedById - createdAt - updatedAt
*Template variables must be validated against an allow-list.*

## 12. TemplateVersion

**Fields:** id - templateId - version - subject - body - createdById - createdAt
**Unique:** (templateId, version)

## 13. Conversation

**Fields:** id - contactId - automationMode - aiReplyCountSinceTakeover - aiReplyCap - escalatedAt - escalatedReason - humanTakeoverAt - humanTakeoverById - lastMessageAt - currentClassification - createdAt - updatedAt
**Indexes:** contactId - automationMode - lastMessageAt - currentClassification

## 14. Message

**Fields:** id - conversationId - contactId - channel - direction - senderType - senderUserId nullable - providerMessageId nullable - idempotencyKey - toAddress - fromAddress - body - status - segmentCount nullable - sentAt - deliveredAt - failedAt - createdAt - updatedAt
**Unique:** providerMessageId when available - idempotencyKey
**Indexes:** conversationId + createdAt - contactId + createdAt - providerMessageId - status

## 15. AIAction

**Fields:** id - conversationId - sourceMessageId - actionType - classification nullable - extractedJson - reasoningSummary nullable - modelName - promptVersion - confidence nullable - createdAt
*Never store hidden chain-of-thought. Store a short operational explanation such as criteria/fields used for routing.*

## 16. ConversationGrade

**Fields:** id - conversationId - score - letterGrade - criteriaJson - calculationVersion - isManualOverride - overrideReason nullable - overriddenById nullable - createdAt
*Only the latest grade needs to be marked current, or use a currentGradeId on Conversation.*

## 17. SuppressionEntry

**Fields:** id - channel - normalizedAddress - reason - source - contactId nullable - createdAt - createdById nullable
**Examples:** STOP - UNSUBSCRIBE - MANUAL - HARD_BOUNCE - COMPLAINT
*This table is checked immediately before every outbound send.*

## 18. Property

**Fields:** id - normalizedAddress unique - address - city - state - zip - type nullable - beds nullable - baths nullable - squareFeet nullable - yearBuilt nullable - askingPrice nullable - listingStatus nullable - createdAt - updatedAt - deletedAt
*Photos/files should use Attachment records rather than large binary fields in MySQL.*

## 19. Deal

**Fields:** id - propertyId - contactId - pipelineId - stageId - ownerId - source - gradeSnapshot nullable - status - lossReasonId nullable - originalDealId nullable - createdAt - updatedAt - closedAt nullable - deletedAt
**Indexes:** contactId - ownerId - pipelineId + stageId - propertyId - status - createdAt

## 20. Pipeline

**Fields:** id - name - type - isActive - createdAt - updatedAt
**Expected records:** Deals - AI/Inbound Deals

## 21. PipelineStage

**Fields:** id - pipelineId - name - orderIndex - probability - isTerminal - terminalOutcome nullable - requiresLossReason - isActive - createdAt - updatedAt

## 22. DealStageHistory

**Fields:** id - dealId - fromStageId nullable - toStageId - actorId nullable - reason nullable - createdAt

## 23. LossReason

**Fields:** id - name - isActive - orderIndex - createdAt - updatedAt

## 24. AssignmentRoundRobin

**Fields:** id - name - currentIndex - isActive - updatedAt

## 25. RoundRobinMember

**Fields:** id - roundRobinId - userId - isActive - position - createdAt
**Unique:** (roundRobinId, userId)

## 26. AssignmentLog

**Fields:** id - entityType - entityId - assignedFromUserId nullable - assignedToUserId - reason - roundRobinId nullable - createdAt

## 27. CallLog

**Fields:** id - contactId - dealId nullable - userId - direction - providerCallId nullable - durationSeconds - outcome - notes - recordingUrl nullable - consentNoticeUsed boolean - startedAt - endedAt - createdAt

## 28. Attachment

**Fields:** id - entityType - entityId - fileName - mimeType - sizeBytes - storageKey - uploadedById - createdAt - deletedAt
*Validate MIME type, extension, size and storage permissions.*

## 29. ContractTemplate

**Fields:** id - name - documentType - version - sourceFileId - isActive - createdById - createdAt - updatedAt

## 30. ContractFieldMapping

**Fields:** id - templateId - mergeKey - sourceEntity - sourceField - required - defaultValue nullable - createdAt

## 31. ContractDocument

**Fields:** id - dealId - templateId - templateVersion - generationNumber - pdfAttachmentId - docxAttachmentId - generatedById - generatedAt - status - errorMessage nullable
*Never overwrite old versions.*

## 32. ImportBatch / ImportRow

**ImportBatch:** id - fileName - totalRows - validRows - invalidRows - duplicateRows - status - uploadedById - createdAt - committedAt
**ImportRow:** id - batchId - rowNumber - rawJson - normalizedJson - status - duplicateContactId nullable - errorsJson - warningsJson - createdAt

## 33. IntegrationCredential

**Fields:** id - providerType - encryptedSecret - maskedIdentifier - status - createdById - updatedById - createdAt - updatedAt
*Never return encryptedSecret or raw credentials from API.*

## 34. Notification

**Fields:** id - userId - type - title - body - entityType - entityId - readAt - createdAt

## 35. AuditLog

**Fields:** id - actorUserId nullable - action - entityType - entityId - requestId - oldValuesJson nullable - newValuesJson nullable - metadataJson nullable - createdAt

## 36. Job / JobAttempt

**Job:** id - type - payloadJson - status - idempotencyKey - runAfter - attempts - maxAttempts - lockedAt - completedAt - lastError - createdAt - updatedAt
**JobAttempt:** id - jobId - attemptNumber - startedAt - endedAt - status - error

## 37. IdempotencyKey

**Fields:** id - key - operation - requestHash - responseJson - expiresAt - createdAt
**Unique:** key + operation

## 38. Critical Indexes

**Must exist for:** 
- Contact normalized email/phone/license 
- Contact status/owner 
- CadenceEnrollment nextTouchAt/status 
- Message conversationId/createdAt 
- Message providerMessageId 
- Conversation automationMode 
- Deal owner/pipeline/stage 
- Property normalizedAddress 
- Assignment round-robin position 
- Audit entity/timestamp 
- Jobs status/runAfter 
- webhook event/provider IDs

## 39. Transaction Requirements

**Use transactions for:** 
- contact enrollment 
- opt-out + suppression + cadence pause 
- property + deal creation 
- round-robin assignment 
- deal terminal transition + cadence resume 
- user deactivation + open-lead reassignment 
- contract generation version creation 
- manual grade override 
- duplicate merge if introduced later

## 40. Data Integrity Rules

- A contact can have at most one active cadence enrollment.
- DO_NOT_CONTACT overrides all cadence states.
- OPTED_OUT overrides all automated messaging.
- Human takeover prevents AI replies.
- Terminal deal stage triggers cadence resume only once.
- Duplicate property offers resolve to the normalized property.
- Every outbound provider operation has an idempotency key.
- Every assignment creates an AssignmentLog.
- Every important mutation creates an AuditLog.
