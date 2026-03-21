## Local Auth + Local DB (DIY Architecture, Odoo-inspired)

Your current repo already has a working auth scheme:

- Custom API routes: `src/app/api/auth/*`
- A cookie session: `learnova_session` (base64url JSON)

Because of that, introducing Auth.js / NextAuth right now is **high risk** (it would change routes, cookies, and session semantics and can break role-gating + existing UI flows).

The safer approach is:

| Layer | Recommended choice | Why |
| :--- | :--- | :--- |
| **Data Tier** | **PostgreSQL (local/Docker)** OR **SQLite (local file)** | Local-first requirement; SQLite is quickest, Postgres is closer to production behavior. |
| **Logic Tier (ORM)** | **Prisma** | Fast schema + migrations + seed; easy to swap SQLite ↔ Postgres later. |
| **Auth System** | **Keep current `/api/auth/*` + cookie session**, backed by DB | Minimal breakage: only swap the user store + password hashing. |

---

## Step-by-step workflow (compatible with existing code)

### 1) Database foundation (Data Tier)
* [ ] **Choose local DB:**
	* **Option A (fastest): SQLite** via Prisma (file-based, zero services).
	* **Option B (best parity): Postgres** local install or Docker.
* [ ] **Initialize Prisma:** `npx prisma init`.
* [ ] **Define baseline schemas:** at minimum `User` with `email`, `passwordHash`, `name`, `role`.
* [ ] **Add seed data:** create the three demo accounts (learner/instructor/admin) so the app works immediately.

### 2) Authentication (Identity Layer) — keep existing routes
* [ ] **Password hashing:** use `bcryptjs` (or `bcrypt` if native builds are fine) to hash passwords on signup.
* [ ] **Login verification:** update `POST /api/auth/login` to query DB by email and verify password hash.
* [ ] **Signup persistence:** update `POST /api/auth/signup` to create a DB user record (and reject duplicate emails).
* [ ] **Session cookie stays:** keep `learnova_session` cookie name + shape so existing role gating continues working.

Important security note:
- Today the session cookie is just base64url JSON (not signed). For local-only demo it may be acceptable, but it’s tamperable.
- Safer minimal upgrade that won’t break the UI: add an **HMAC signature** (e.g. `value.signature`) or switch to a small signed-cookie library.

### 3) Odoo-style security (Authorization)
* [ ] **RBAC:** keep using the `role` field from session (already supported) and enforce in server components/API.
* [ ] **Middleware protection:** keep the existing backoffice protections; expand as needed for new API routes.
* [ ] **Record rules:** in API routes, ensure learners can only read/write their own:
	- enrollments
	- progress
	- quiz attempts
	- reviews

### 4) Integration
* [ ] **Keep UI unchanged:** the UI already calls `/api/auth/*`; only the backend implementation changes.
* [ ] **Add env vars:** `DATABASE_URL` and an app secret for signing cookies (if you add signing).

Deployment note:
- If the rule is “no external DB”, then hosting becomes tricky (Vercel + SQLite file won’t persist across deploys).
- If deployment is required, you’ll need a self-hosted DB on the same machine/network (still “local” to your infra), or a permitted provider.

---

Implementing a self-managed "Odoo-style" stack means you are taking full control of the identity and data layers. Since you are already using **Next.js**, you don't need to build a separate backend server; Next.js acts as both your frontend and your Node.js API layer.

## 🛠️ Linking workflow (DB → Prisma → existing Auth routes)

To link a local DB to the current app without breaking auth flows:

### Step 1: The Data Layer
- If using Postgres: create a local database named `learnova`.
- If using SQLite: choose a file path (e.g. `prisma/dev.db`).


### Step 2: The Logic Layer (Prisma)
1. **Initialize:** `npx prisma init`
2. **Connect:** set `DATABASE_URL` in `.env`.
3. **Migrate:** prefer `npx prisma migrate dev` (keeps a migration history).
4. **Seed:** add a seed script so demo users exist.

### Step 3: Identity layer (current code)
1. Keep `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`, `/api/auth/logout`.
2. Replace `MOCK_USERS` lookups with Prisma queries.
3. Keep returning the same session shape so the rest of the app doesn’t change.

---

### Recommended checklist (minimal breakage)
- [ ] Pick DB: SQLite (fast) or Postgres (parity).
- [ ] Add Prisma + migrations + seed.
- [ ] Implement `User` persistence (unique email).
- [ ] Hash passwords on signup; verify on login.
- [ ] Keep session cookie contract; optionally add signing to prevent tampering.
- [ ] Next iteration: move learning persistence (enrollments/progress/reviews/quiz attempts) from cookies/localStorage into DB.

