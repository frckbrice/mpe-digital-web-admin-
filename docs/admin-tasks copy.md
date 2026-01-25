## Admin Tasks – Consolidated & De‑duplicated

This document consolidates **admin-only and admin-allowed tasks**, removes duplicated tasks/endpoints, and keeps **all original content and intent unchanged**, only reorganized and merged for clarity.

---

## 1. Quote & Quote‑Request Management

### 1.1 List all quotes

**Tasks**

* List all quote requests (no assignment restriction).
* Filter by status, assignedAgentId, clientId.
* Search by reference, project description, or client (name/email).
* Pagination via page and pageSize.

**Endpoints**

* `GET /api/admin/quotes`

  * Params: status, assignedAgentId, clientId, search, page, pageSize
* Alternative (agent-style, admin allowed):

  * `GET /api/agent/quotes` (admin sees all quotes)

---

### 1.2 View a single quote (full detail)

**Tasks**

* View one quote with client, assigned agent, documents, messages, and statusHistory.

**Endpoints**

* `GET /api/agent/quotes/[id]` (recommended; full include)
* `GET /api/quote-requests/[id]` (allowed; slightly different include)

---

### 1.3 Assign / reassign / unassign agent

**Tasks**

* Assign an unassigned quote to an agent.
* Reassign from one agent to another.
* Unassign (set assignedAgentId to null).
* Trigger status history and notifications (new/previous agent).

**Endpoint**

* `PATCH /api/admin/quotes/[id]/assign`

  * Body: `{ "assignedAgentId": "user-id" | null }`

**Note**

* `PATCH /api/agent/quotes/[id]` can update assignedAgentId but **does not trigger assignment notifications**.

---

### 1.4 Update quote (status, priority, internal notes)

**Tasks**

* Change status (any QuoteStatus, including CANCELLED).
* Change priority (LOW, NORMAL, HIGH, URGENT).
* Set or change internalNotes.
* Optionally change assignedAgentId (prefer assign endpoint above).

**Endpoint**

* `PATCH /api/agent/quotes/[id]`

  * Body: `{ status?, priority?, assignedAgentId?, internalNotes? }`

**Restriction**

* Only admin can change status when the quote is already CANCELLED.

---

### 1.5 Quote dashboard & statistics

**Tasks**

* Total, pending, in-progress, completed quote counts.
* New quotes in last 30 days.
* Recent quotes (reference, status, submission date, client).
* User, message, and document stats (used on same dashboard).

**Endpoint**

* `GET /api/admin/stats`

---

## 2. Document Management

### 2.1 Upload document for a quote

**Tasks**

* Upload a file for any quote (client, agent, or admin).
* Types: PROJECT_BRIEF, DESIGN_MOCKUP, LOGO_FILE, BRAND_GUIDELINES, CONTENT_DOCUMENT, REFERENCE_IMAGE, CONTRACT, INVOICE, OTHER.
* Formats: PDF, JPG, PNG, DOC, DOCX (≤ 10MB).

**Endpoint**

* `POST /api/quote-requests/[id]/documents`

  * FormData: file, documentType

---

### 2.2 Approve or reject a document

**Tasks**

* Set document status to APPROVED or REJECTED.
* rejectionReason required when REJECTED.

**Endpoint**

* `PATCH /api/documents/[id]`

  * Body: `{ status: "APPROVED" | "REJECTED", rejectionReason? }`

---

### 2.3 Delete a document

**Tasks**

* Delete any document on any quote (admin unrestricted).

**Endpoint**

* `DELETE /api/documents/[id]`

---

## 3. Messaging

### 3.1 List messages

**Tasks**

* List messages where admin is sender or recipient.
* Filter by quoteId, search, page, pageSize.
* Admin does **not** see system‑wide messages.

**Endpoint**

* `GET /api/messages`

**Note**

* To see **all messages for a quote**, use quote detail endpoints:

  * `GET /api/agent/quotes/[id]`
  * `GET /api/quote-requests/[id]`

---

### 3.2 Send message

**Tasks**

* Send a message linked to a quote.
* Recipient must be the client or assigned agent.

**Endpoint**

* `POST /api/messages`

  * Body: `{ recipientId, content, subject?, quoteId?, replyToId? }`

---

### 3.3 Mark message as read

**Tasks**

* Mark received messages as read (admin must be recipient).

**Endpoint**

* `PATCH /api/messages/[id]/read`

---

## 4. User Management (Admin‑only)

### Tasks & Endpoints

* List users: `GET /api/admin/users`
* Create user: `POST /api/admin/users`
* Get user: `GET /api/admin/users/[id]`
* Update user: `PATCH /api/admin/users/[id]`
* Deactivate user (soft): `DELETE /api/admin/users/[id]`

**Notes**

* Cannot deactivate own account.
* DELETE is soft‑delete (isActive: false).

---

## 5. Clients (Read‑only)

**Tasks**

* List active clients with search & pagination.

**Endpoint**

* `GET /api/agent/clients`

---

## 6. Admin Settings (Admin‑only)

### Tasks

* Get the current admin’s settings and preferences.
* Update admin preferences:
  * **Notifications:** email, push, quoteAssignments, quoteUpdates, userActivity.
  * **Dashboard:** defaultView, itemsPerPage, showRecentActivity.
  * **System:** timezone, language, theme.

### Endpoints

* `GET /api/admin/settings` – returns `{ userId, email, settings: { notifications, dashboard, system } }`
* `PATCH /api/admin/settings` – body: `{ notifications?, dashboard?, system? }` (partial update)

### Note

* Persistence is TODO (see §12 Design Notes).

---

## 7. Authentication & Profile (Shared)

* Login: `POST /api/auth/login`
* Logout: `POST /api/auth/logout`
* Current user: `GET /api/auth/me`
* Profile get/update: `GET /api/auth/profile`, `PATCH /api/auth/profile`
* Google auth: `POST /api/auth/google`
* Forgot/reset password: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

---

## 8. Notifications (Shared – own only)

* List notifications: `GET /api/notifications`
* Count unread: `GET /api/notifications/count`
* Mark one read: `PATCH /api/notifications/[id]/read`
* Mark all read: `PATCH /api/notifications/read-all`

---

## 9. What Admin Cannot Do

* Cancel a quote (`POST /api/quote-requests/[id]/cancel`) – client only.
* Use client summary (`GET /api/quote-requests/summary`) – client scoped.

Admin must use:

* `GET /api/admin/stats`
* `PATCH /api/agent/quotes/[id]`

---

## 10. QuoteStatus Values

`SUBMITTED, UNDER_REVIEW, QUOTE_PREPARED, QUOTE_SENT, CLIENT_REVIEWING, ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED, CANCELLED`

---

## 11. Admin‑Only vs Shared Endpoints

**Admin‑only**

* `/api/admin/users`
* `/api/admin/settings`
* `/api/admin/stats`
* `/api/admin/quotes`
* `/api/admin/quotes/[id]/assign`

**Shared**

* `/api/agent/quotes`
* `/api/agent/clients`
* `/api/quote-requests/[id]`
* `/api/documents/[id]`
* `/api/messages`
* `/api/auth/*`

---

## 12. Design Notes (Unchanged)

* Admin works mainly via separate admin app/API.
* Assignment triggers statusHistory & notifications.
* User deletion is soft‑delete.
* Admin settings persistence is TODO.
* To create the first admin user (bootstrap): `pnpm tsx scripts/create-admin-user.ts <firebase-uid> <email>`.
