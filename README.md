# MPE Web Admin App

Admin dashboard for [MPE Web app](../MPE%20Web%20app/). Authenticates with the same Firebase project and calls the MPE Web app API to manage it.

## Setup

1. **Env**

   Copy Firebase and API URL from MPE Web app:

   ```bash
   cp .env.example .env.local
   ```

   Set in `.env.local`:

   - All `NEXT_PUBLIC_FIREBASE_*` (same values as MPE Web app `src/lib/firebase`)
   - `NEXT_PUBLIC_APP_URL` — MPE Web app in **production** (e.g. `https://mpedigitalsolutions.com`)
   - `NEXT_PUBLIC_LOCAL_APP_URL` — MPE Web app when running **locally** (e.g. `http://localhost:3000`)

   The app uses `NEXT_PUBLIC_LOCAL_APP_URL` in development (`pnpm dev`) and `NEXT_PUBLIC_APP_URL` in production builds.

   **Production:** `NEXT_PUBLIC_*` are inlined at **build time**. On Vercel (or similar), add `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_LOCAL_APP_URL` in Project Settings > Environment Variables and ensure they are available for the **Build** (not only Runtime). Otherwise Firebase will not initialize in the client and you may see "Failed to get user" on login.

2. **CORS on MPE Web app**

   The browser calls the MPE Web app API **directly** (e.g. `GET /api/auth/me` with `Authorization: Bearer <token>`). To avoid CORS blockage, the MPE Web app must allow:

   - **Origin**: the Admin app URL (e.g. `http://localhost:3001` in dev, or your production admin URL)
   - **Headers**: `Authorization`, `Content-Type` (the `Authorization` header triggers a preflight)

   Set in the MPE Web app `.env`:

   - `ADMIN_APP_URL=http://localhost:3001` (or your admin app URL)

   Ensure MPE Web’s CORS config uses `ADMIN_APP_URL` (or equivalent) for `Access-Control-Allow-Origin` on `/api/auth/me` and that `Access-Control-Allow-Headers` includes `Authorization`. Dev: localhost origins are usually allowed by the MPE Web app CORS middleware.

3. **Install and run**

   ```bash
   pnpm install
   pnpm dev
   ```

   Admin app: http://localhost:3001  
   MPE Web app must be running (e.g. on 3000).

## Auth

- **Firebase**: same config and credentials as MPE Web app.
- **Role**: only users with `role === 'ADMIN'` can use this app. Others get "Access denied. Admin only." after sign-in.

## Routes

- `/` → redirects to `/login`
- `/login` — Firebase email/password and Google sign-in
- `/dashboard` — Admin overview (stats from MPE Web app `/api/admin/stats`)
- `/dashboard/quotes` — Quote requests; list, filters, assign to agents, view detail
- `/dashboard/users` — Users (create, edit, deactivate)
- `/dashboard/agents` — Agents list (uses `/api/admin/users?role=AGENT`)

## API (MPE Web app)

The admin app calls the **MPE Web app** API. Base URL: `NEXT_PUBLIC_APP_URL` (prod) or `NEXT_PUBLIC_LOCAL_APP_URL` (dev).

### Admin-only (ADMIN role)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/admin/quotes` | GET | List all quotes; `?status=&assignedAgentId=&clientId=&search=&page=&pageSize=` |
| `/api/admin/quotes/[id]/assign` | PATCH | Assign or unassign quote to agent; `{ assignedAgentId: string \| null }` |
| `/api/admin/users` | GET, POST | List (filter `role`, `search`, `isActive`, `page`, `pageSize`) or create user |
| `/api/admin/users/[id]` | GET, PATCH, DELETE | Get, update, or deactivate user |
| `/api/admin/stats` | GET | Dashboard stats (users, quotes, messages, documents, recentQuotes) |
| `/api/admin/settings` | GET, PATCH | Admin settings (not persisted in current schema) |

### Shared (AGENT + ADMIN)

The same routes are used by the **agent UI in the MPE Web app** and by this **admin app**. The server checks role: ADMIN sees all; AGENT is limited to assigned quotes.

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/agent/quotes` | GET | List quotes; ADMIN: all; AGENT: assigned + unassigned; `?status=&assignedToMe=&search=&page=&pageSize=` |
| `/api/agent/quotes/[id]` | GET, PATCH | Quote detail and update `status`, `priority`, `internalNotes`; assignment uses `/api/admin/quotes/[id]/assign` |
| `/api/agent/clients` | GET | List clients; `?search=&page=&pageSize=`; used for e.g. client filter on quotes |

### Auth

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/auth/me` | GET | Current user (Bearer). Admin app requires `user.role === 'ADMIN'`. |
| `/api/auth/google` | POST | Google sign-in; body: `{ idToken, email, displayName?, photoURL? }` |
| `/api/auth/logout` | POST | Logout (optional server-side token revocation) |

## Tech

- Next.js 15 (App Router), React 19
- Firebase (client only), Zustand, TanStack Query
- Styling: same as MPE Web app (Tailwind, CSS variables, `theme-tech`)
