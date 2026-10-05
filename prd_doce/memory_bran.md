# AI Memory Brain --- Conversation Context & Decision State

## 1. Purpose

The Memory Brain is the application layer that gives the AI a reliable, bounded view of the contact and conversation without allowing the AI to invent facts or bypass CRM rules.

It is not a replacement for the database. The database remains the source of truth.

## 2. Source of Truth Hierarchy

When constructing AI context, use this priority:
1. Current CRM contact/property/deal data.
2. Persisted conversation messages.
3. Persisted structured AI actions/extractions.
4. Current conversation state.
5. Admin-configured AI persona/instructions.
6. Temporary derived context.

The AI must not treat its previous generated text as authoritative facts.

## 3. Memory Layers

**Layer A --- Contact Memory**
Stable CRM facts: 
- name - brokerage - license - email/phone - market - tags - status - owner

**Layer B --- Conversation Memory**
The chronological message thread: 
- inbound messages - outbound human messages - outbound AI messages - timestamps - classifications - takeover/escalation state

**Layer C --- Structured Opportunity Memory**
Facts extracted from the conversation: 
- property address - asking price - condition - timeline - stated intent - wants call - other approved fields
*These should be stored as structured fields/JSON with source message references.*

**Layer D --- Operational State**
- AI_ACTIVE/HUMAN_ACTIVE
- consecutive AI reply count
- escalation reason
- current grade
- current classification
- active deal
- cadence paused/resumed

## 4. Context Builder

**Before an AI response:**
- Load contact
- Load conversation
- Load recent/full thread according to context budget
- Load structured extracted facts
- Load active deal/property if any
- Load current grade
- Load AI settings
- Load allowed objective
- Load safety rules

*The context builder should return a structured object, not a random string assembled in controllers.*

## 5. Suggested Context Shape

```json
{
  "contact": {
    "name": "...",
    "brokerage": "...",
    "market": "DFW"
  },
  "conversation": {
    "automationMode": "AI_ACTIVE",
    "classification": "HAS_PROPERTY",
    "aiReplyCount": 2,
    "aiReplyCap": 5
  },
  "opportunity": {
    "propertyAddress": null,
    "askingPrice": null,
    "condition": null,
    "timeline": null
  },
  "messages": [],
  "instructions": {
    "objective": "Determine whether the agent has a property and collect approved information."
  }
}
```

## 6. AI Output Contract

AI should return structured output:

```json
{
  "classification": "HAS_PROPERTY",
  "reply": "Thanks — what is the property address?",
  "extracted": {
    "propertyAddress": null,
    "askingPrice": null,
    "condition": null,
    "timeline": null
  },
  "needsHuman": false,
  "optOutDetected": false,
  "confidence": 0.0
}
```

*The server validates this structure before acting.*

## 7. Never Trust AI for Authorization

**AI cannot:** 
- change user roles - change permissions - assign arbitrary users - bypass suppression - bypass DO_NOT_CONTACT - bypass human takeover - send directly to a provider without server checks - commit an offer - agree to terms

*AI only proposes an action. The application service decides whether that action is allowed.*

## 8. AI Guardrails

**Hard rules:** 
- no offers 
- no price commitments 
- no contract commitments 
- no named-person impersonation 
- disclose assistant identity when asked 
- respect opt-out immediately 
- stop when human takeover is active 
- stop after configured reply cap 
- escalate if agent requests a human 
- escalate if AI cannot progress

## 9. Memory Updates

**After every inbound message:**
1. persist raw message
2. classify
3. extract facts
4. store AIAction
5. update structured opportunity memory
6. recalculate grade
7. evaluate routing
8. only then generate/send AI response if allowed

*Never overwrite historical messages.*

## 10. Property Extraction

**If address is detected:**
1. normalize address
2. verify confidence/required address components
3. search Property by normalized address
4. reuse existing property if found
5. otherwise create property
6. create/reuse deal
7. assign owner
8. pause cadence
9. notify human

*Do not create duplicate properties from small formatting differences.*

## 11. Conversation Grading

The Memory Brain supplies structured evidence for: 
- response received - property mentioned - address captured - stated intent - sentiment - response depth

The grade engine calculates the score. AI may provide classification/evidence, but final scoring must follow deterministic configured criteria.

## 12. Human Takeover

When human takeover occurs:
`automationMode = HUMAN_ACTIVE`
*The AI worker must check this state immediately before sending.*

If the human releases the conversation:
`automationMode = AI_ACTIVE`
`aiReplyCount = 0`

## 13. AI Failure

**If AI provider fails:** 
- preserve inbound message 
- preserve conversation 
- create failed job 
- flag conversation as AI pending/error 
- make thread available to human 
- notify according to configured policy

*Never drop the inbound message.*

## 14. Prompt Versioning

**Store:** 
- persona version - instruction version - model name - timestamp - AI action source message

*This makes AI behavior reproducible enough for operational debugging.*

## 15. Privacy / Retention

Store only data required for the CRM workflow. Avoid copying credentials, payment data or unrelated sensitive information into AI prompts. Provider-specific retention controls should be documented separately.

## 16. Memory Anti-Patterns

**Do not:** 
- store only a giant summary and discard messages 
- let AI-generated summaries overwrite source facts 
- use browser/local storage as source of truth 
- allow prompt text to modify authorization 
- send a message without a final suppression/state check 
- allow AI to continue after human takeover 
- create deals solely from an unvalidated hallucinated address

## 17. Operational Rule

- **Database** = source of truth.
- **Memory Brain** = context builder.
- **AI** = decision proposal.
- **Service layer** = business-rule authority.
- **Provider** = transport only.
