# Backend Tester Test Cases (FastEMIs)

Last updated: February 26, 2026

This document is the backend QA handoff for the current Django + DRF implementation.
It covers implemented APIs, role rules, validation checks, and test cases the tester should execute.

## 1. Environment and Setup

- Backend root: `/Users/biswajitpanda/Desktop/MadLabs/backend/fastEMIsBackend/fastEMIsBackend`
- Database: SQLite (`db.sqlite3`)
- Backend run:
  - `cd /Users/biswajitpanda/Desktop/MadLabs/backend/fastEMIsBackend/fastEMIsBackend`
  - `source .venv/bin/activate`
  - `python manage.py runserver`
- API base URL: `http://127.0.0.1:8000`
- Frontend (if used): `http://localhost:4200`

## 2. Current Backend Function Inventory (Implemented)

### 2.1 Auth and Session
- `POST /api/signup`
- `POST /api/login`
- `POST /api/agent/access`
- `POST /api/agent/login` (compat)
- `POST /api/logout`
- `POST /api/token/refresh/`

### 2.2 User Profile and Completion
- `GET /api/userprofile/`
- `PATCH /api/userprofile/` (multipart + JSON)
- Completion metadata in payload:
  - `profile_complete`
  - `profile_progress`
  - `missing_fields`

### 2.3 Location Capture (Post-login user only)
- `POST /api/location/capture`

### 2.4 Agent User Management
- `GET /api/agent/users`
- `GET /api/agent/users/:user_id`
- `PATCH /api/agent/users/:user_id` (`disable` / `enable`)
- `DELETE /api/agent/users/:user_id`

### 2.5 Support Chat (User <-> Agent)
- `GET /api/chat/threads`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `GET /api/chat/media`
- `DELETE /api/chat/messages/:message_id` (agent only)
- `PATCH /api/chat/threads/:user_id` (favorite)
- `DELETE /api/chat/threads/:user_id` (full chat delete)
- `POST /api/chat/alias`
- `POST /api/chat/presence`

### 2.6 Announcements
- `GET /api/announcements` (user view)
- `GET /api/agent/announcements`
- `POST /api/agent/announcements`
- `PATCH /api/agent/announcements/:announcement_id`
- `DELETE /api/agent/announcements/:announcement_id`

### 2.7 Payments
- `GET /api/agent/payments/global`
- `POST /api/agent/payments/global`
- `DELETE /api/agent/payments/global/:config_id`
- `GET /api/payments/global/active`
- `GET /api/agent/payments/templates`
- `POST /api/agent/payments/templates/:template_id` (implement template)
- `DELETE /api/agent/payments/templates/:template_id`
- `GET /api/payments/transactions`
- `POST /api/payments/transactions`
- `GET /api/agent/payments/transactions`
- `PATCH /api/agent/payments/transactions/:transaction_id`
- `DELETE /api/agent/payments/transactions/:transaction_id`

### 2.8 Agreements
- `GET /api/agent/agreements/questions`
- `POST /api/agent/agreements/questions`
- `PATCH /api/agent/agreements/user-visibility`
- `POST /api/agent/agreements/reset-user`
- `GET /api/agreements/questions`
- `POST /api/agreements/answers`
- `POST /api/agreements/complete`

### 2.9 Community + Ghost Members + Ghost Chats
- Ghost member setup:
  - `GET /api/community/ghost-members`
  - `POST /api/community/ghost-members`
  - `PATCH /api/community/ghost-members/:persona_id`
  - `DELETE /api/community/ghost-members/:persona_id`
- Community settings:
  - `GET /api/community/settings`
  - `PATCH /api/community/settings` (agent only)
- Public community feed:
  - `GET /api/community/feed`
  - `POST /api/community/feed`
- Ghost private thread flow:
  - `GET /api/ghost-chats/threads`
  - `POST /api/ghost-chats/threads` (user direct by persona)
  - `POST /api/ghost-chats/threads/from-community` (user from community post)
  - `PATCH /api/ghost-chats/threads/:thread_id` (agent)
  - `DELETE /api/ghost-chats/threads/:thread_id` (agent)
  - `GET /api/ghost-chats/messages`
  - `POST /api/ghost-chats/messages`
  - `DELETE /api/ghost-chats/messages/:message_id` (agent)

## 3. Credentials and Role Rules for Testing

### 3.1 Agent
- Agent username label: `Kratos`
- Agent passcode API: `7879`
- Agent access endpoint: `POST /api/agent/access`

### 3.2 User
- Create via `POST /api/signup`
- Login via `POST /api/login`

### 3.3 Important current behavior
- Password mode is currently dev/testing plain-string compare on login.
- API auth uses JWT access token in `Authorization: Bearer <access_token>`.
- Most endpoints are `IsAuthenticated`; role checks done inside views.

## 4. Core Validation and Business Rules to Verify

### 4.1 Profile completion gate data rules
Required fields for complete profile:
- `mobile_number`
- `marital_status`
- `pincode`
- `city`
- `full_address`
- `employment_type`
- `what_you_do`
- `monthly_salary`
- `requested_amount`
- `aadhar_number` (12 digits)
- `pan_number` (format: `ABCDE1234F`)
- `aadhar_image` (image/video allowed)
- `pancard_image` (image/video allowed)
- `live_photo` (image only)
- Additional conditional: `spouse_occupation` mandatory if `marital_status = married`

### 4.2 Announcements limits
- Max 2 active global announcements.
- Max 2 active private announcements per target user.

### 4.3 Payments rules
- Global config validity fixed to 5 minutes.
- Global config supports:
  - QR only
  - Bank only
  - Both
- If bank path used, required fields:
  - `account_holder_name`, `bank_name`, `account_number`, `ifsc`
- Templates keep last 24 hours.
- User transaction submit requires:
  - `transaction_id`
  - `proof_image` (image)
- Initial transaction status = `pending`.

### 4.4 Community/Ghost rules
- Users post as real user identity only.
- Agents must post via ghost member in community (`ghost_member_id` required).
- Ghost member `ghost_id`:
  - required on create
  - unique
  - pattern: `[A-Za-z0-9_-]{3,40}`
  - locked on edit
- Private reply from community is allowed only for ghost-authored community posts.
- Contact details (email/phone) in community/ghost messages are masked and logged.

## 5. Smoke Test Suite (Run First)

| ID | API | Steps | Expected |
|---|---|---|---|
| SM-01 | `POST /api/signup` | Create a new user | `201`, returns `access`, `refresh`, `user` |
| SM-02 | `POST /api/login` | Login same user | `200`, returns token + user payload |
| SM-03 | `PATCH /api/userprofile/` | Patch all required profile fields + files | `200`, `profile_complete=true` |
| SM-04 | `POST /api/agent/access` | Send passcode `7879` | `200`, returns agent token |
| SM-05 | `GET /api/agent/users` | Use agent token | `200`, user appears in list |
| SM-06 | `POST /api/community/ghost-members` | Create one ghost member | `201`, ghost member returned |
| SM-07 | `POST /api/community/feed` | User posts public text | `201`, post in feed |
| SM-08 | `POST /api/community/feed` | Agent posts with `ghost_member_id` | `201`, post author shown as ghost member |
| SM-09 | `POST /api/agent/payments/global` | Upload QR or bank | `201`, active config present |
| SM-10 | `GET /api/payments/global/active` | Use user token | `200`, active payment payload |
| SM-11 | `POST /api/payments/transactions` | Submit proof + txid | `201`, status `pending` |
| SM-12 | `PATCH /api/agent/payments/transactions/:id` | Set status `verified` | `200`, user side status reflects |
| SM-13 | `GET /api/agent/agreements/questions` + `POST /api/agent/agreements/questions` | Save question set | `200` |
| SM-14 | `PATCH /api/agent/agreements/user-visibility` | Enable for user | `200` |
| SM-15 | `POST /api/agreements/complete` | Submit answers + signature + consent video | `200`, agreement locked |

## 6. Detailed Test Cases

## 6.1 Auth and Session

| ID | Endpoint | Role | Input | Expected |
|---|---|---|---|---|
| AUTH-01 | `POST /api/signup` | Public | valid payload | `201`, token + user payload |
| AUTH-02 | `POST /api/signup` | Public | duplicate email | `400`, email validation error |
| AUTH-03 | `POST /api/signup` | Public | short password (<4) | `400` |
| AUTH-04 | `POST /api/login` | Public | valid email/password | `200` |
| AUTH-05 | `POST /api/login` | Public | wrong password | `401`, `Invalid Email or Password` |
| AUTH-06 | `POST /api/agent/access` | Public | passcode `7879` | `200`, role vendor payload |
| AUTH-07 | `POST /api/agent/access` | Public | wrong passcode | `401`, `Invalid passcode` |
| AUTH-08 | `POST /api/logout` | User/Agent | valid refresh | `205` |
| AUTH-09 | `POST /api/logout` | User/Agent | invalid refresh | `400`, `Invalid token` |
| AUTH-10 | `POST /api/token/refresh/` | User/Agent | valid refresh | `200`, new access token |

## 6.2 Profile and Location

| ID | Endpoint | Role | Input | Expected |
|---|---|---|---|---|
| PROF-01 | `GET /api/userprofile/` | User | none | `200`, profile + completion fields |
| PROF-02 | `PATCH /api/userprofile/` | User | all required fields valid | `200`, `profile_complete=true` |
| PROF-03 | `PATCH /api/userprofile/` | User | missing required fields | `400`, field-level required errors |
| PROF-04 | `PATCH /api/userprofile/` | User | married without spouse occupation | `400`, spouse error |
| PROF-05 | `PATCH /api/userprofile/` | User | invalid Aadhaar | `400` |
| PROF-06 | `PATCH /api/userprofile/` | User | invalid PAN format | `400` |
| PROF-07 | `PATCH /api/userprofile/` | User | negative salary/requested amount | `400` |
| PROF-08 | `PATCH /api/userprofile/` | User | live photo non-image | `400` |
| PROF-09 | `POST /api/location/capture` | User | valid lat/lng/accuracy | `200`, location payload returned |
| PROF-10 | `POST /api/location/capture` | Agent | valid lat/lng | `403`, user-only message |
| PROF-11 | `POST /api/location/capture` | User | lat > 90 or lng > 180 | `400` |
| PROF-12 | `GET /api/agent/users/:id` | Agent | none | `200`, `last_location` present if captured |

## 6.3 Agent User Management

| ID | Endpoint | Role | Input | Expected |
|---|---|---|---|---|
| AUSR-01 | `GET /api/agent/users` | Agent | none | `200`, list of non-agent users |
| AUSR-02 | `GET /api/agent/users` | User | none | `403` |
| AUSR-03 | `GET /api/agent/users/:id` | Agent | valid id | `200`, field statuses present |
| AUSR-04 | `GET /api/agent/users/:id` | Agent | invalid id | `404` |
| AUSR-05 | `PATCH /api/agent/users/:id` | Agent | `{action:"disable"}` | `200`, `is_active=false` |
| AUSR-06 | `PATCH /api/agent/users/:id` | Agent | `{action:"enable"}` | `200`, `is_active=true` |
| AUSR-07 | `PATCH /api/agent/users/:id` | Agent | invalid action | `400` |
| AUSR-08 | `DELETE /api/agent/users/:id` | Agent | valid id | `200`, user deleted |

## 6.4 Support Chat APIs

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| CHAT-01 | `GET /api/chat/threads` | User | own thread summary | `200`, `thread` object |
| CHAT-02 | `GET /api/chat/threads` | Agent | full list | `200`, `threads[]` with unread and active-now |
| CHAT-03 | `GET /api/chat/threads?search=` | Agent | search by name/email/mobile | filtered list |
| CHAT-04 | `GET /api/chat/threads?favorites_only=true` | Agent | only favorites | filtered list |
| CHAT-05 | `GET /api/chat/messages` | User | no params | `200`, recent own thread messages |
| CHAT-06 | `GET /api/chat/messages?user_id=:id` | Agent | target user | `200` |
| CHAT-07 | `GET /api/chat/messages?since_id=:id` | User/Agent | incremental fetch | only new messages |
| CHAT-08 | `POST /api/chat/messages` | User | text only | `201` |
| CHAT-09 | `POST /api/chat/messages` | User | media only | `201` |
| CHAT-10 | `POST /api/chat/messages` | Agent | without `user_id` | `400` |
| CHAT-11 | `POST /api/chat/messages` | Agent | valid `user_id` + text | `201` |
| CHAT-12 | `GET /api/chat/media` | User/Agent | fetch media list | `200` |
| CHAT-13 | `DELETE /api/chat/messages/:id` | User | delete attempt | `403` |
| CHAT-14 | `DELETE /api/chat/messages/:id` | Agent | valid message | `200`, deleted for everyone |
| CHAT-15 | `PATCH /api/chat/threads/:user_id` | Agent | `{favorite:true}` | `200` |
| CHAT-16 | `DELETE /api/chat/threads/:user_id` | Agent | full delete | `200`, deleted count |
| CHAT-17 | `POST /api/chat/alias` | Agent | set alias | `200` |
| CHAT-18 | `POST /api/chat/presence` | User/Agent | heartbeat | `200`, `is_active_now=true` |

## 6.5 Announcements

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| ANN-01 | `GET /api/announcements` | User | fetch current global + own private | `200`, max relevant cards |
| ANN-02 | `GET /api/agent/announcements` | Agent | fetch all active | `200`, includes counts |
| ANN-03 | `POST /api/agent/announcements` | Agent | create global 1 | `201` |
| ANN-04 | `POST /api/agent/announcements` | Agent | create global 2 | `201` |
| ANN-05 | `POST /api/agent/announcements` | Agent | create global 3 | `400`, max 2 error |
| ANN-06 | `POST /api/agent/announcements` | Agent | private without target | `400` |
| ANN-07 | `POST /api/agent/announcements` | Agent | private target missing user | `404` |
| ANN-08 | `POST /api/agent/announcements` | Agent | private 1 and 2 for same user | both `201` |
| ANN-09 | `POST /api/agent/announcements` | Agent | private 3 for same user | `400`, max 2 error |
| ANN-10 | `PATCH /api/agent/announcements/:id` | Agent | edit text/cta/priority | `200` |
| ANN-11 | `PATCH /api/agent/announcements/:id` | Agent | activate violating max rules | `400` |
| ANN-12 | `DELETE /api/agent/announcements/:id` | Agent | delete | `200` |

## 6.6 Payments and Templates

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| PAY-01 | `POST /api/agent/payments/global` | Agent | QR only | `201`, `has_qr=true`, `has_bank=false` |
| PAY-02 | `POST /api/agent/payments/global` | Agent | bank only with required fields | `201`, `has_bank=true` |
| PAY-03 | `POST /api/agent/payments/global` | Agent | both QR + bank | `201` |
| PAY-04 | `POST /api/agent/payments/global` | Agent | bank partial fields | `400`, bank validation error |
| PAY-05 | `POST /api/agent/payments/global` | Agent | no QR and no bank | `400` |
| PAY-06 | `GET /api/agent/payments/global` | Agent | active config fetch | `200` |
| PAY-07 | `GET /api/payments/global/active` | User | when active exists | `200`, `active_payment` present |
| PAY-08 | `GET /api/payments/global/active` | User | after 5 min expiry | `200`, `active_payment=null` + update message |
| PAY-09 | `DELETE /api/agent/payments/global/:id` | Agent | manual delete | `200` |
| PAY-10 | `GET /api/agent/payments/templates` | Agent | list 24h templates | `200` |
| PAY-11 | `POST /api/agent/payments/templates/:id` | Agent | implement template | `200` new active config |
| PAY-12 | `DELETE /api/agent/payments/templates/:id` | Agent | delete template | `200` |

## 6.7 Payment Transactions

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| TX-01 | `POST /api/payments/transactions` | User | valid `transaction_id` + proof image | `201`, status `pending` |
| TX-02 | `POST /api/payments/transactions` | User | duplicate transaction_id for same user | `400` |
| TX-03 | `POST /api/payments/transactions` | User | missing proof image | `400` |
| TX-04 | `POST /api/payments/transactions` | User | non-image proof | `400` |
| TX-05 | `GET /api/payments/transactions` | User | own history | `200` |
| TX-06 | `GET /api/agent/payments/transactions` | Agent | all transactions | `200` |
| TX-07 | `GET /api/agent/payments/transactions?search=` | Agent | search by user/txid | filtered list |
| TX-08 | `PATCH /api/agent/payments/transactions/:id` | Agent | `{status:"verified"}` | `200` |
| TX-09 | `PATCH /api/agent/payments/transactions/:id` | Agent | `{status:"rejected"}` | `200` |
| TX-10 | `PATCH /api/agent/payments/transactions/:id` | Agent | invalid status | `400` |
| TX-11 | `DELETE /api/agent/payments/transactions/:id` | Agent | delete record | `200` |

## 6.8 Agreements

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| AGR-01 | `GET /api/agent/agreements/questions` | Agent | fetch current active questions | `200`, up to 20 |
| AGR-02 | `POST /api/agent/agreements/questions` | Agent | save 1-20 unique question IDs | `200` |
| AGR-03 | `POST /api/agent/agreements/questions` | Agent | >20 questions | `400` |
| AGR-04 | `POST /api/agent/agreements/questions` | Agent | duplicate question IDs | `400` |
| AGR-05 | `PATCH /api/agent/agreements/user-visibility` | Agent | enable tab for user | `200` |
| AGR-06 | `GET /api/agreements/questions` | User | when tab disabled | `403` |
| AGR-07 | `GET /api/agreements/questions` | User | when tab enabled | `200`, readonly flags included |
| AGR-08 | `POST /api/agreements/answers` | User | valid subset pending answers | `200`, created count |
| AGR-09 | `POST /api/agreements/answers` | User | duplicate IDs | `400` |
| AGR-10 | `POST /api/agreements/answers` | User | invalid question ID | `400` |
| AGR-11 | `POST /api/agreements/complete` | User | missing signature or video | `400` |
| AGR-12 | `POST /api/agreements/complete` | User | complete with all pending answers + signature + video | `200`, completed timestamp set |
| AGR-13 | `POST /api/agreements/complete` | User | second submit after completion | `400`, locked |
| AGR-14 | `POST /api/agent/agreements/reset-user` | Agent | reset completed user | `200`, answers/media cleared |

## 6.9 Community Feed and Ghost Member Setup

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| COM-01 | `GET /api/community/feed` | User | fetch feed | `200`, includes `safety_rules`, `settings`, `feed` |
| COM-02 | `POST /api/community/feed` | User | text post | `201`, author is user |
| COM-03 | `POST /api/community/feed` | User | media-only post | `201` |
| COM-04 | `POST /api/community/feed` | Agent | no `ghost_member_id` | `400` |
| COM-05 | `POST /api/community/feed` | Agent | valid `ghost_member_id` | `201`, author_type persona |
| COM-06 | `POST /api/community/feed` | User/Agent | empty content and no media | `400` |
| COM-07 | `POST /api/community/feed` | User/Agent | reply to non-existent parent | `404` |
| COM-08 | `POST /api/community/feed` | User/Agent | reply-to-reply depth > 1 | `400` |
| COM-09 | `POST /api/community/feed` | User/Agent | post with email/phone in text | `201`, masked content and moderation note |
| COM-10 | `GET /api/community/ghost-members` | Agent | list all | `200` |
| COM-11 | `GET /api/community/ghost-members` | User | list only active | `200` |
| COM-12 | `POST /api/community/ghost-members` | Agent | valid create | `201` |
| COM-13 | `POST /api/community/ghost-members` | Agent | duplicate `ghost_id` | `400` |
| COM-14 | `POST /api/community/ghost-members` | Agent | invalid `ghost_id` pattern | `400` |
| COM-15 | `PATCH /api/community/ghost-members/:id` | Agent | edit display_name/info/tag | `200` |
| COM-16 | `PATCH /api/community/ghost-members/:id` | Agent | try editing `ghost_id` | `400`, locked |
| COM-17 | `DELETE /api/community/ghost-members/:id` | Agent | hard delete ghost member | `200`, deleted threads/messages/posts counts |
| COM-18 | `PATCH /api/community/settings` | Agent | update title/member count | `200` |
| COM-19 | `PATCH /api/community/settings` | User | update attempt | `403` |

## 6.10 Ghost Private Chat

| ID | Endpoint | Role | Scenario | Expected |
|---|---|---|---|---|
| GHT-01 | `POST /api/ghost-chats/threads` | User | create/open by persona_id | `200/201` |
| GHT-02 | `POST /api/ghost-chats/threads` | Agent | create attempt | `403` |
| GHT-03 | `POST /api/ghost-chats/threads/from-community` | User | on ghost-authored post | `200/201` |
| GHT-04 | `POST /api/ghost-chats/threads/from-community` | User | on real user post | `400` |
| GHT-05 | `GET /api/ghost-chats/threads` | User | own persona threads | `200` |
| GHT-06 | `GET /api/ghost-chats/threads` | Agent | global thread list with user + persona | `200` |
| GHT-07 | `GET /api/ghost-chats/messages?thread_id=` | User/Agent | fetch messages | `200` |
| GHT-08 | `GET /api/ghost-chats/messages` | User/Agent | missing thread_id | `400` |
| GHT-09 | `POST /api/ghost-chats/messages` | User | send text | `201` |
| GHT-10 | `POST /api/ghost-chats/messages` | Agent | send reply from ghost persona thread | `201`, sender label persona name |
| GHT-11 | `POST /api/ghost-chats/messages` | User/Agent | send phone/email in content | `201`, masked and moderation note |
| GHT-12 | `PATCH /api/ghost-chats/threads/:id` | Agent | favorite toggle | `200` |
| GHT-13 | `PATCH /api/ghost-chats/threads/:id` | Agent | persona change without override when locked | `400` |
| GHT-14 | `PATCH /api/ghost-chats/threads/:id` | Agent | persona change with `admin_override=true` | `200` |
| GHT-15 | `DELETE /api/ghost-chats/messages/:id` | Agent | delete message for everyone | `200` |
| GHT-16 | `DELETE /api/ghost-chats/threads/:id` | Agent | delete full ghost chat | `200` |

## 7. Authorization Matrix (Must Verify)

| Endpoint Group | User Allowed | Agent Allowed |
|---|---|---|
| User profile and location | Yes | Agent location capture must fail |
| Agent user management | No | Yes |
| Chat delete for everyone | No | Yes |
| Ghost member CRUD | No | Yes |
| Community settings update | No | Yes |
| Agent payments and templates | No | Yes |
| User payment submit/history | Yes (own only) | Agent has separate transaction endpoints |
| Agreement admin endpoints | No | Yes |

## 8. DB Verification Queries (SQLite)

Run from backend root:
- `sqlite3 db.sqlite3`

Use these checks after API actions:

```sql
-- Latest community posts
SELECT id, author_type, user_id, persona_id, content, content_masked, created_at
FROM myapp_communitypost
ORDER BY id DESC
LIMIT 20;

-- Ghost members
SELECT id, display_name, ghost_id, identity_tag, info, is_active, created_at
FROM myapp_communitypersona
ORDER BY id DESC;

-- Ghost private threads
SELECT id, user_id, persona_id, is_persona_locked, is_favorite, last_message_at
FROM myapp_ghostchatthread
ORDER BY id DESC;

-- Ghost messages
SELECT id, thread_id, sender_role, sender_label, message_type, deleted_for_everyone, content_masked, created_at
FROM myapp_ghostchatmessage
ORDER BY id DESC
LIMIT 30;

-- Support chat messages
SELECT id, user_id, sender_role, message_type, deleted_for_everyone, created_at
FROM myapp_chatmessage
ORDER BY id DESC
LIMIT 30;

-- Announcements
SELECT id, type, target_user_id, title, is_active, created_at
FROM myapp_announcement
ORDER BY id DESC;

-- Global payment configs
SELECT id, is_active, created_at, expires_at, account_holder_name, bank_name, ifsc
FROM myapp_globalpaymentconfig
ORDER BY id DESC;

-- Payment templates
SELECT id, created_at, account_holder_name, bank_name, ifsc
FROM myapp_paymentconfigtemplate
ORDER BY id DESC
LIMIT 30;

-- Payment transactions
SELECT id, user_id, transaction_id, status, amount_inr, reviewed_at, created_at
FROM myapp_paymenttransaction
ORDER BY id DESC;

-- Agreement questions and answers
SELECT id, question_id, description, is_active, updated_at
FROM myapp_agreementquestion
ORDER BY question_id;

SELECT id, user_id, question_id, answer, created_at
FROM myapp_agreementanswer
ORDER BY id DESC
LIMIT 40;

-- User profile completion/location key fields
SELECT id, email, is_admin, is_active, agreement_tab_enabled, agreement_completed_at,
       last_location_latitude, last_location_longitude, last_location_accuracy_m, last_location_captured_at
FROM myapp_customuser
ORDER BY id DESC;

-- Moderation logs
SELECT id, context, action, reason, channel_ref, created_at
FROM myapp_moderationevent
ORDER BY id DESC
LIMIT 40;
```

## 9. API Payload Examples

### 9.1 Agent login
```json
POST /api/agent/access
{
  "passcode": "7879"
}
```

### 9.2 Create ghost member
```json
POST /api/community/ghost-members
{
  "display_name": "Raj Mentor",
  "ghost_id": "raj_mentor",
  "identity_tag": "mentor",
  "info": "Guides users on EMI steps.",
  "avatar_url": "",
  "short_bio": "",
  "tone_guidelines": "Simple and practical",
  "is_active": true,
  "sort_order": 40
}
```

### 9.3 Agent community post (mandatory ghost member)
```json
POST /api/community/feed
{
  "content": "Hi everyone, upload your pending document today.",
  "ghost_member_id": 3
}
```

### 9.4 User transaction submit (multipart)
- Fields:
  - `transaction_id`
  - `proof_image` (file)
  - optional: `amount_inr`, `payment_set_id`, `payment_scope`

### 9.5 Agreement complete (multipart)
- Fields:
  - `answers_json` (JSON string list of `{questionId, answer}`)
  - `signature_image` (image file)
  - `consent_video` (video file)

## 10. Regression Risks (Must Recheck Every Build)

- Agent cannot send community post without `ghost_member_id`.
- User cannot see `ghost_id` internal key in persona payload.
- Ghost member delete should remove linked community + ghost thread history.
- Announcement active limits (2 global, 2 private per user) always enforced.
- Global payment expiry after 5 minutes and cleanup path works.
- Transaction status update reflects in user history.
- Agreement lock works after complete; reset fully clears state.
- Location capture remains user-only.
- Chat delete-for-everyone remains agent-only.

## 11. Suggested Test Execution Order

1. Auth (`signup/login/agent/access`)
2. Profile completion + location capture
3. Agent user management
4. Community + ghost member setup
5. Ghost private threads/messages
6. Support chat and media
7. Announcements
8. Payments + transactions
9. Agreements
10. Final DB verification queries
