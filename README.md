# MPE Web Admin App

Administrative dashboard for the **MPE Web app** (main product). This app does not host its own backend: it shares the same Firebase project and talks to the MPE Web app API for all data and operations. Built for **ADMIN** and **MODERATOR** roles with role-based navigation and feature access.

---

## Overview


| Item          | Description |
|---------------|-------------|
| **Purpose**   | Admin and moderation portal for the MPE Web app (quotes, users, agents, clients, contracts, invoices, payments, projects, moderation, audit). |
| **Relationship** | Satellite app: authenticates with the same Firebase project as the main app and proxies all API calls to it. The browser never calls the MPE Web app directly. |
| **Port**      | Runs on **3001** (MPE Web app typically on 3000). |


---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Framework** | Next.js 15 (App Router), React 19 |
| **Language** | TypeScript |
| **Auth** | Firebase (client), Firebase Admin (server); JWT validated via MPE Web `/api/auth/me` |
| **State & Data** | Zustand (auth/session), TanStack Query (server state, mutations) |
| **UI** | Tailwind CSS, Radix UI–based components (shadcn-style), Lucide icons, Sonner toasts |
| **i18n** | i18next + react-i18next (French default, EN/FR), locale persisted in cookie |
| **Theming** | next-themes (light/dark), CSS variables |

---

## Architecture & Particularities

### 1. Dual-app, proxy-only API

- The admin app **does not implement business logic or a database**. It is a front-end that calls the **MPE Web app** API.
- **All** requests to the main app go through this app’s own Next.js API routes (same-origin from the browser). So:
  - No CORS configuration is needed on the MPE Web app for the admin origin.
  - One place to attach `Authorization: Bearer <token>` and handle errors (e.g. 503 when the main app is unreachable).
- Base URL for the main app is chosen at runtime: `NEXT_PUBLIC_LOCAL_APP_URL` in development, `NEXT_PUBLIC_APP_URL` in production, with optional `NEXT_PUBLIC_PREVIEW_APP_URL` for Vercel previews (`src/lib/mpe-web-url.ts`).

### 2. Feature-based structure

- Domain logic is grouped under **feature modules** in `src/components/features/<feature>/`:
  - `api/`: TanStack Query hooks (queries/mutations), types, and optional data helpers.
  - `components/`: page clients and dialogs/sheets used by the dashboard.
  - `store/`: feature-specific Zustand store when needed (e.g. auth).
  - Barrel `index.ts` re-exports the public API of the feature.
- Shared UI lives in `src/components/ui/`; app-level config and utilities in `src/lib/` and `src/providers/`.

### 3. Role-based access (ADMIN vs MODERATOR)

- Only users with `role === 'ADMIN'` or `role === 'MODERATOR'` can use the app (enforced after `/api/auth/me` in the auth store).
- **MODERATOR**: limited navigation—dashboard, moderation, payments, audit, quotes, profile. Blocked from: stats, users, agents, clients, contracts, invoices, projects, moderators. Direct URL access to blocked paths redirects to `/dashboard/moderation`.
- **ADMIN**: full access including stats, user/agent/moderator management, contracts, invoices, projects.
- Role and route rules are centralized in the dashboard layout (`MODERATOR_ALLOWED_HREFS`, `MODERATOR_BLOCKED_PREFIXES`).

### 4. Auth flow and token handling

- Sign-in: Firebase (email/password or Google) in the client; then the app calls **its own** `/api/auth/me` (proxied to MPE Web) with the Firebase ID token to get the backend user and role.
- Session state: Zustand store + optional `userCache` in `localStorage` for a quick snapshot. Token refresh and 401 retry (e.g. `TOKEN_INVALID`) are handled in `syncAuthState` with optional auth logging (`src/lib/utils/auth-logger.ts`) for debugging.

### 5. Security and error handling

- **Error sanitization** (`src/lib/utils/error-sanitizer.ts`): strips stack traces, file paths, and internal messages before showing anything to the user. Firebase error codes are mapped to safe messages and optional i18n keys; API errors use a small, consistent payload extraction so real server messages can still be shown in toasts without leaking internals.

### 6. Proxied API surface

- Proxies are organized by domain: admin (catch-all + dedicated routes for agents, clients, moderators), agent, auth, documents, messages, quote-requests, notifications, moderation, payments, contracts, invoices, projects, upload. The client uses a single `apiFetch()` that, in the browser, sends requests to these same-origin routes; the server then forwards to the MPE Web app with the same path and method and forwards auth headers.

---

## Project Structure (high level)

```
src/
├── app/
│   ├── api/                    # Next.js API routes (proxies to MPE Web app)
│   │   ├── admin/[[...path]]   # Admin catch-all + agents, clients, moderators
│   │   ├── agent/[[...path]]   # Agent endpoints (quotes, clients)
│   │   ├── auth/               # me, google, logout, profile
│   │   ├── contracts/          # contracts proxy
│   │   ├── documents/          # documents proxy
│   │   ├── invoices/           # invoices proxy
│   │   ├── messages/           # messages proxy
│   │   ├── moderation/         # moderation proxy
│   │   ├── notifications/     # notifications proxy
│   │   ├── payments/           # payments proxy
│   │   ├── projects/           # projects proxy
│   │   ├── quote-requests/     # quote-requests proxy
│   │   └── upload/             # upload
│   ├── dashboard/              # Dashboard pages (layout enforces auth + role)
│   │   ├── agents, audit, clients, contracts, invoices,
│   │   ├── moderation, moderators, payments, profile, projects,
│   │   ├── quotes, stats, users
│   │   ├── layout.tsx          # Sidebar, role-based nav, theme/locale
│   │   └── page.tsx            # Dashboard home
│   ├── login/
│   ├── layout.tsx              # Root layout, providers, fonts
│   └── page.tsx                # Redirects to /login
├── components/
│   ├── features/               # Feature modules (api + components)
│   │   ├── auth/               # Login, store, useAuth, syncAuthState
│   │   ├── quotes/             # Quotes list, detail, assign, validate, messages
│   │   ├── users/              # Users CRUD, dialogs
│   │   ├── agents/             # Agents list, edit
│   │   ├── clients/            # Clients list, create/edit
│   │   ├── contracts/          # Contracts list, detail sheet
│   │   ├── invoices/           # Invoices list, detail sheet
│   │   ├── payments/           # Payments list, decision dialog
│   │   ├── projects/           # Projects list, detail sheet
│   │   ├── moderation/         # Moderation queue, decisions
│   │   ├── audit/              # Audit view
│   │   ├── notifications/     # Notifications dropdown
│   │   ├── dashboard-home/     # Dashboard stats and overview
│   │   ├── dashboard-profile/  # Profile page
│   │   └── stats/              # Stats page
│   └── ui/                     # Shared UI (buttons, dialogs, tables, etc.)
├── lib/
│   ├── api-client.ts           # apiFetch, proxy detection, Bearer token
│   ├── mpe-web-url.ts          # getMpeWebAppBaseUrl (dev/preview/prod)
│   ├── api/endpoints.ts        # Centralized path constants (admin, agent, auth)
│   ├── firebase/               # firebase-client, firebase-admin
│   ├── i18n/config.ts          # i18next config, FR default
│   └── utils/                  # auth-logger, error-sanitizer, token-refresh
├── locales/                    # en/common.json, fr/common.json
├── providers/                  # AuthProvider, QueryProvider, ThemeProvider, I18nProvider
├── constants/                  # Locale, supported locales
└── middleware.ts               # Redirect / → /login; skip api, static, etc.
```

---

## Setup

### 1. Environment

Copy the example env and set variables (use the same Firebase config as the MPE Web app):

```bash
cp .env.example .env.local
```

In `.env.local`:

- **Firebase (client):** all `NEXT_PUBLIC_FIREBASE_*` (same as MPE Web app).
- **MPE Web app URL:**
  - `NEXT_PUBLIC_APP_URL` — main app in **production** (e.g. `https://mpedigitalsolutions.com`).
  - `NEXT_PUBLIC_LOCAL_APP_URL` — main app when running **locally** (e.g. `http://localhost:3000`).

The app uses `NEXT_PUBLIC_LOCAL_APP_URL` in development and `NEXT_PUBLIC_APP_URL` in production. On Vercel, set these (and any `NEXT_PUBLIC_PREVIEW_APP_URL`) in Project Settings → Environment Variables and ensure they are available at **build** time so the client bundle gets the correct base URL.

### 2. CORS

The admin app proxies all MPE Web API calls through its own API routes. The browser never calls the MPE Web app directly, so **you do not need to allow the admin app’s origin in CORS** on the MPE Web app for normal use.

### 3. Install and run

```bash
pnpm install
pnpm dev
```

- Admin app: **http://localhost:3001**
- MPE Web app must be running (e.g. on 3000) for API calls to succeed.

---

## Auth & Roles

- **Firebase:** same config and credentials as the MPE Web app.
- **Backend user:** after sign-in, the app calls `/api/auth/me` (proxied) with the Firebase ID token; the MPE Web app returns the user and role.
- **Allowed roles:** only `ADMIN` and `MODERATOR` can use the app. Others are treated as “access denied” and not stored as authenticated.
- **Moderator restrictions:** enforced in the dashboard layout (sidebar and redirects); moderators cannot open stats, users, agents, clients, contracts, invoices, projects, or moderators.

---

## Routes & Features

| Route | Description | ADMIN | MODERATOR |
|-------|-------------|:----:|:---------:|
| `/` | Redirects to `/login` | — | — |
| `/login` | Firebase email/password + Google sign-in | ✓ | ✓ |
| `/dashboard` | Overview / stats from MPE Web `/api/admin/stats` | ✓ | ✓ (no stats data) |
| `/dashboard/stats` | Stats dashboard | ✓ | ✗ |
| `/dashboard/quotes` | Quote requests; list, filters, assign, detail, messages | ✓ | ✓ |
| `/dashboard/users` | Users (create, edit, deactivate) | ✓ | ✗ |
| `/dashboard/agents` | Agents list (`/api/admin/users?role=AGENT`) | ✓ | ✗ |
| `/dashboard/moderators` | Moderators management | ✓ | ✗ |
| `/dashboard/clients` | Clients list, create/edit | ✓ | ✗ |
| `/dashboard/contracts` | Contracts list, detail | ✓ | ✗ |
| `/dashboard/invoices` | Invoices list, detail | ✓ | ✗ |
| `/dashboard/projects` | Projects list, detail | ✓ | ✗ |
| `/dashboard/moderation` | Moderation queue and decisions | ✓ | ✓ |
| `/dashboard/payments` | Payments and decisions | ✓ | ✓ |
| `/dashboard/audit` | Audit view | ✓ | ✓ |
| `/dashboard/profile` | Profile | ✓ | ✓ |

---

## API (MPE Web app)

Base URL: `NEXT_PUBLIC_APP_URL` (prod) or `NEXT_PUBLIC_LOCAL_APP_URL` (dev). All calls from the admin app go through the admin app’s proxy routes, which forward to this base.

### Admin (ADMIN; some endpoints also MODERATOR)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/admin/quotes` | GET | List quotes; `?status=&assignedAgentId=&clientId=&search=&page=&pageSize=` |
| `/api/admin/quotes/[id]` | GET | Quote detail (with internal notes for ADMIN/MODERATOR) |
| `/api/admin/quotes/[id]/assign` | PATCH | Assign or unassign agent; `{ assignedAgentId: string \| null }` |
| `/api/admin/quotes/[id]/validate` | PATCH | Validate or reject quote (ADMIN/MODERATOR) |
| `/api/admin/users` | GET, POST | List (filter `role`, `search`, `isActive`, `page`, `pageSize`) or create user |
| `/api/admin/users/[id]` | GET, PATCH, DELETE | Get, update, or deactivate user |
| `/api/admin/stats` | GET | Dashboard stats (ADMIN only) |
| `/api/admin/settings` | GET, PATCH | Admin settings |

### Shared (ADMIN, MODERATOR, AGENT — server enforces role)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/agent/quotes` | GET | List quotes; ADMIN: all; AGENT: assigned + unassigned |
| `/api/agent/quotes/[id]` | GET, PATCH | Quote detail; update status, priority, internalNotes |
| `/api/agent/clients` | GET | List clients (e.g. for filters) |

### Auth

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/auth/me` | GET | Current user (Bearer). Admin app requires `user.role` in `['ADMIN','MODERATOR']`. |
| `/api/auth/google` | POST | Google sign-in |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/profile` | GET, PATCH | Profile |

Additional domains (contracts, invoices, payments, projects, moderation, documents, messages, notifications, quote-requests, upload) are proxied via the same pattern; see `src/app/api/` and `src/lib/api/endpoints.ts` for details.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port **3001** |
| `pnpm build` | Production build |
| `pnpm start` | Start production server on port **3001** |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript check (`tsc --noEmit`) |
| `pnpm test` | Run tests in watch mode (Vitest) |
| `pnpm test:run` | Run tests once (CI) |
| `pnpm test:coverage` | Run tests with coverage report |

---

## Testing

- **Runner:** [Vitest](https://vitest.dev/) with [jsdom](https://github.com/jsdom/jsdom)
- **Component / DOM:** [React Testing Library](https://testing-library.com/react) and [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)
- **Location:** Tests live next to source: `*.test.ts` / `*.test.tsx` or `*.spec.ts` / `*.spec.tsx`
- **Config:** `vitest.config.ts`, `vitest.setup.ts` (jest-dom globals)

Run `pnpm test` for watch mode or `pnpm test:run` for a single run (e.g. in CI). If you’ve just added the test-related dependencies, run `pnpm install` (or `pnpm install --no-frozen-lockfile` if the lockfile is out of date), then commit the updated `pnpm-lock.yaml` so CI can use `--frozen-lockfile`.

---

## Security

- **Headers:** Security headers are set in `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`. `X-Powered-By` is disabled.
- **Env validation:** `src/lib/env.ts` defines a Zod schema for required environment variables. Use `validateEnv()` (e.g. in a pre-deploy step or at app init) to fail fast on misconfiguration.
- **Error sanitization:** User-facing errors are sanitized in `src/lib/utils/error-sanitizer.ts` (no stack traces or internal paths).
- **Dependency audit:** CI runs `pnpm audit --audit-level=high` (see below).

---

## CI / Workflow

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to `main` and `develop`:

1. **lint-and-test:** install → lint → typecheck → tests
2. **build:** production build (uses dummy env vars if secrets are not set, so CI can build without real Firebase)
3. **audit:** `pnpm audit --audit-level=high` (allowed to fail so it doesn’t block merges)

Set repository secrets for real Firebase config if you want the build job to use production-like env.

---


## Summary 

- **What it is:** A Next.js 15 (App Router) + React 19 admin dashboard that acts as a **satellite** to another product (MPE Web app). It uses the same Firebase project and delegates all business logic and data to the main app’s API.
- **Notable aspects:** Proxy-only API (no CORS, single origin), role-based UI (ADMIN vs MODERATOR), feature-based folder structure, centralized error sanitization, token refresh and 401 retry, i18n (FR/EN), and a broad dashboard surface (quotes, users, agents, clients, contracts, invoices, payments, projects, moderation, audit, stats, profile).
- **Stack:** TypeScript, Tailwind, Radix-based UI, TanStack Query, Zustand, Firebase, and Next.js API routes as the only “backend” (pure proxy to the MPE Web app).
