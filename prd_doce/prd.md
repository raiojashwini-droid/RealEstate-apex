# Realtor Outreach & Acquisition CRM --- PRD

## 1. Document Purpose

This document is the product source of truth for the custom acquisitions
CRM described in the September 2026 RFP. It converts the business
requirements into implementable modules, rules, states, permissions,
acceptance criteria, and non-functional requirements.

**Business:** EM Home Buyers / Momentum Capital
**Market:** Dallas--Fort Worth, Texas
**Department:** Acquisitions
**Primary workflow:** Realtor/agent outreach → conversation → property
capture → deal pipeline → human takeover.

## 2. Product Goals

- Maintain a permanent searchable database of agent contacts.
- Bulk-import contacts from CSV with validation and duplicate detection.
- Automatically send email and SMS outreach on a configurable cadence.
- Reset cadence after inbound replies.
- Use AI to handle inbound SMS conversations within strict guardrails.
- Extract property information and create property/deal records.
- Route address-bearing leads and human-needed conversations through round-robin assignment.
- Give humans a mobile-friendly workspace to review, claim, reply, call, note, and manage deals.
- Grade every conversation from A--D with a 0--100 score and visible reasoning.
- Generate filled purchase/assignment documents from configurable templates.
- Preserve a complete chronological timeline and audit history.
- Keep business rules configurable rather than hard-coded.

## 3. Users and Permissions

**Admin**
- Full access.
- Manage users and roles.
- Manage integration credentials.
- Configure cadence, templates, AI persona, grading, pipeline stages, loss reasons, tags/statuses.
- View reports and audit logs.
- Manage contract templates.

**Manager**
- Contact, campaign, conversation and pipeline operations.
- Reassign leads.
- Move deals between pipelines.
- View settings except integration credentials.
- Generate contracts.

**Agent**
- Work assigned leads.
- Claim eligible unassigned leads.
- Manually reply.
- Move own deals between stages.
- Click-to-call.
- Log calls and notes.
- Generate contracts.

**Read-only**
- View contacts, conversations, pipeline and reports.
- No create/update/delete actions.

*Server-side rule: UI hiding is not security. Every protected endpoint must verify authentication, role permission, record ownership/scope and object state.*

## 4. Core Entities

- User
- Contact
- ContactNote
- Tag
- ContactTag
- CadenceSettings
- CadenceEnrollment
- OutreachTemplate
- TemplateVersion
- Message
- Conversation
- ConversationGrade
- AIAction
- SuppressionEntry
- Property
- Deal
- Pipeline
- PipelineStage
- DealStageHistory
- AssignmentLog
- RoundRobinSettings
- CallLog
- Attachment
- ContractTemplate
- ContractFieldMapping
- ContractDocument
- ImportBatch
- ImportRow
- Notification
- IntegrationCredential
- AuditLog
- Job / JobAttempt
- IdempotencyKey

## 5. Contact Requirements

**Required operational fields:** 
- full name 
- license number 
- brokerage 
- email 
- normalized mobile phone 
- mobile-capable flag 
- market, default DFW 
- status 
- source 
- cadence start date 
- last contacted 
- last response 
- owner 
- tags 
- timestamped notes

**Statuses:** 
- ACTIVE_IN_OUTREACH 
- RESPONDED 
- ESCALATED 
- DECLINED 
- OPTED_OUT 
- DO_NOT_CONTACT

**Contact rules:** 
- Email, phone and license number participate in duplicate detection. 
- Existing records must be surfaced rather than blindly duplicated. 
- Manual DO_NOT_CONTACT permanently blocks automation. 
- Soft delete only. 
- Field-level changes are audited.

## 6. CSV Intake

**Flow:** 
1. Download template. 
2. Upload CSV. 
3. Detect columns. 
4. Map CSV columns to CRM fields. 
5. Validate rows. 
6. Show errors/warnings and duplicate matches. 
7. Preview commit. 
8. Commit valid rows only after explicit confirmation. 
9. Store import batch and row-level results. 
10. Do not scrape the web in this phase.

## 7. Cadence Engine

All cadence rules are configuration.

**Initial Touch**
On enrollment: 
- send day-0 email 
- send day-0 SMS 
- record cadence start 
- record touch number 
- create dispatch records before sending

**Recurring Touch**
- every 30 days from the last touch
- next email and SMS
- both channels use the same configured interval
- contacts never automatically retire for inactivity

**Reply Reset**
- Any inbound reply resets the cadence clock to the reply timestamp.

**Deal Suspension**
- While a contact has an active deal being worked: 
  - automated cadence is paused 
  - cadence resumes when the deal reaches a terminal stage

**Guardrails**
- recipient-local permitted sending hours
- max one automated message per channel per contact per 24 hours
- provider throttling
- queued remainder
- permanent suppression check immediately before every send
- idempotent dispatch

## 8. Messaging

**Email**
Track: 
- queued - sent - delivered - opened - clicked - bounced - complained - failed - inbound reply

Production requirements: 
- SPF - DKIM - DMARC - unsubscribe - physical postal address - hard-bounce suppression

**SMS**
Provider abstraction must support Twilio or Telnyx. 
- 10DLC registration required before production SMS. 
- Sending-number pool and rotation. 
- STOP, UNSUBSCRIBE, END, QUIT and CANCEL cause immediate opt-out/suppression. 
- HELP gets a compliant help response. 
- Every inbound/outbound SMS is stored.

## 9. AI Conversation

AI uses: 
- full prior thread 
- current contact record 
- conversation state 
- configured persona/instructions 
- allowed collection fields

AI objective: 
1. Determine whether the agent has a property. 
2. Collect address. 
3. Collect asking price. 
4. Collect condition. 
5. Collect timeline. 
6. Route to human when necessary.

Inbound classification: 
- INTERESTED - NOT_INTERESTED - HAS_PROPERTY - QUESTION - WANTS_CALL - OPT_OUT - UNCLEAR

AI must never: 
- make an offer 
- commit to price 
- agree to transaction terms 
- impersonate a named person 
- continue after human takeover/escalation 
- exceed the configured consecutive-reply cap

AI can: 
- identify itself as an assistant when asked 
- ask permitted follow-up questions 
- extract structured property information 
- trigger escalation/deal creation according to configured rules

## 10. Conversation Grading

Every conversation has: 
- letter grade A--D 
- numeric score 0--100 
- criteria results 
- weighted score breakdown 
- last calculated timestamp 
- optional manual override 
- override reason and actor

Starting criteria: 
- response received 
- property mentioned 
- address captured 
- stated intent 
- sentiment 
- response depth

Admin can configure criteria, weights and thresholds.

## 11. Routing

**Leads with Address**
If a property address is detected/confirmed: 
1. normalize address 
2. find/create property 
3. find/create deal 
4. put deal in AI/Inbound Deals 
5. stage = New Property 
6. assign owner by round robin 
7. log assignment 
8. notify assignee 
9. pause cadence for the contact

**Needs Human**
If AI cannot progress or the agent asks for a person: 
1. flag conversation 
2. stop AI 
3. assign by round robin 
4. notify assignee 
5. show in Needs Human queue

Round-robin state must survive restarts and skip deactivated users.

## 12. Pipelines

Two separate pipelines: 
- Deals 
- AI/Inbound Deals

Same default stages: 
- New Property --- 10% 
- Qualifying --- 20% 
- Offer Made --- 55% 
- Offer Accepted --- 100%, terminal/won 
- Offer Rejected --- 0%, terminal/loss 
- Trash --- 0%, terminal/loss 
- Duplicate Lead --- 0%, terminal, link to original 
- Need Help --- 20%, parked/manager queue

Stage names, order, probability and loss reasons are configurable.

Starting loss reasons: 
- Price gap 
- Property sold elsewhere 
- Agent unresponsive 
- Outside buy box 
- Title or condition issue 
- Other

## 13. Property

Fields: 
- normalized address - address - city - state - zip - type - beds - baths - square footage - year built - asking price - listing status - photos - files

Normalized address must have a uniqueness strategy so repeated offers for the same property do not create duplicate property records.

## 14. Contract Generation

Every deal with an address exposes Generate Contract.

Offer fields: 
- purchase price - earnest money - option fee - option period - closing date - buyer entity - seller name(s) - title company - financing type - inspection period - special provisions - configurable additional fields

Admin: 
- uploads Word/PDF templates 
- maps template fields to deal/property/contact fields 
- manages multiple template types

Generation: 
- validate required fields 
- warn with exact missing fields 
- produce filled PDF 
- produce editable Word 
- attach both to deal 
- stamp generated date/user 
- preserve versions on regeneration 
- allow download/email from deal

E-signature is out of scope for this phase.

## 15. Calls

- click-to-call
- inbound call matching
- call direction
- duration
- outcome
- user
- notes
- optional recording
- configurable consent notice
- same communications provider as SMS where supported
- no predictive/power dialer

## 16. Dashboard and Reports

Dashboard: 
- contact counts by status 
- outreach volume 
- reply rate by channel 
- grade distribution 
- current user's work queue 
- system alerts 
- drill-down from every metric

Reports: 
- outreach volume by channel/campaign/touch 
- response rate 
- grade distribution over time 
- leads generated 
- deals created 
- deals by stage 
- activity per team member 
- CSV export

## 17. Notifications

In-app: 
- lead assigned 
- conversation escalated

Admin email alerts: 
- integration failures 
- failed dispatch batches 
- failed jobs 
- bounce/complaint threshold breaches

## 18. Settings

Configurable: 
- cadence interval - permitted sending hours - throttles - AI persona - AI thresholds - AI reply cap - grading criteria/weights - pipelines - stages - loss reasons - tags - statuses - integration credentials - audit log access

## 19. Non-Functional Requirements

- responsive web application
- mobile browser usable
- PWA installable
- no native app in this phase
- pipeline stacks vertically on mobile
- 250,000 contacts
- 25 concurrent users
- target <3 seconds for list views at 100,000 contacts
- integration failure isolation
- idempotent message dispatch
- TLS in transit
- encrypted sensitive data/credentials at rest
- daily backups
- tested restore process
- significant actions audited
- application errors and failed jobs monitored

## 20. Compliance Requirements

Before production: 
- 10DLC brand/campaign registration 
- opt-out keyword handling with evidence 
- permitted sending hours 
- sender identification 
- email unsubscribe 
- physical address 
- SPF/DKIM/DMARC

The proposal must explicitly identify responsibility for 10DLC approval and the fallback plan if registration is rejected.

## 21. Acceptance Checklist

A build is not complete until: 
- authentication and server-side authorization work 
- CSV import validates and deduplicates 
- cadence sends correctly and is idempotent 
- reply resets cadence 
- opt-out blocks all future automation 
- AI context includes prior thread and contact data 
- AI escalation silences the AI 
- address extraction creates/de-duplicates property/deal 
- round robin survives restart and skips inactive users 
- grades recalculate and expose reasoning 
- both pipelines support required stages 
- terminal stages resume cadence 
- contracts validate and version correctly 
- calls/notes/timeline are complete 
- audit log captures significant changes 
- provider failures do not stop unrelated CRM functions 
- backup restore is tested 
- mobile workflow is usable
