# Frontend — ProjectFlow (Next.js)

This folder contains the **website** users interact with: login, project list, Kanban boards, tasks, comments, and real-time updates. It is built with **Next.js** (App Router), **React**, **Tailwind CSS**, and connects to the **backend API** and **Socket.IO** server.

---

## What this app lets users do (simple overview)

1. **Register** — Choose workspace role **Member** or **Project manager** (first account becomes **admin** automatically or run the npm run seed:admin command).  
2. **Log in** — Session stored in the browser (`localStorage`: token + user).  
3. **Dashboard** — Lists projects; **Add project** opens a modal (only **admin** and workspace **project manager** can create projects).  
4. **Project board** — Kanban columns, drag-and-drop tasks, create/edit task dialog, assign people, due dates, priorities, comments, activity.  
5. **People on project** — Add workspace users to a project and set their **project** role (owner is fixed).  
6. **Admin page** — Only workspace **admin** sees the “Admin” link; shows overview of users and projects.  
7. **Dark / light theme** — Toggle in the shell layout.

---

## What you need installed first (prerequisites)

| Requirement | Why |
|-------------|-----|
| **Node.js 20 or newer** | Next.js and tooling expect a current Node. [Download Node](https://nodejs.org/) (LTS). |
| **npm** | Installs packages (npm install) and runs `npm run dev`, etc. |
| **Backend running** | The UI calls `http://localhost:5000/api` by default. Without the API, login and data will fail. |
| **MongoDB (via backend)** | The frontend does not talk to Mongo directly; the backend does. |

Check versions:

```bash
node -v
npm -v
```

---

## Step-by-step: run the frontend on your computer

### Step 0 — Start the backend first

From the **repository root** (parent of `frontend/`):

```bash
npm run backend:dev
```

Or from `backend/`:

```bash
cd backend
npm run dev
```

Wait until you see the API listening (usually port **5000**). Details: **`../backend/README.md`**.

---

### Step 1 — Open a terminal in the `frontend` folder

```bash
cd frontend
```

---

### Step 2 — Install dependencies

```bash
npm install
```

This creates `node_modules/` with React, Next.js, Tailwind, Zustand, etc.

---

### Step 3 — Environment variables (how the UI finds the API)

Next.js reads **public** env vars that start with `NEXT_PUBLIC_`.

1. Copy the example file to **`.env.local`** (recommended for Next.js local secrets and URLs):

   ```bash
   cp .env.example .env.local
   ```

   **Windows PowerShell:**

   ```powershell
   copy .env.example .env.local
   ```

2. Open `.env.local` and check the values:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

| Variable | Meaning |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL for **REST** calls. Must end with `/api` to match the backend router. If your API runs on another port or host, change it here. |
| `NEXT_PUBLIC_SOCKET_URL` | Origin for **Socket.IO** (no `/api` path). Usually same host and port as the backend server. |

**Important:** After changing `.env.local`, **restart** `npm run dev` so Next.js picks up new values.

---

### Step 4 — Start the development server

```bash
npm run dev
```

By default Next.js prints:

```text
http://localhost:3000
```

Open that URL in **Chrome**, **Edge**, or **Firefox**.

---

### Step 5 — Log in or register

- If you used `npm run seed:admin` on the backend, log in with that email/password.  
- Otherwise use **Register**; remember the **first user** becomes workspace **admin**.

---

## NPM scripts (this folder only)

| Command | When to use |
|---------|-------------|
| `npm run dev` | Local development; hot reload; use while coding. |
| `npm run build` | Creates an optimized production build in `.next/`. |
| `npm start` | Runs the **production** build (run `npm run build` first). |

---

## How the code is organized

| Path | Role |
|------|------|
| `app/` | Next.js **App Router** routes: `page.js` files, layouts, `(auth)` group for login/register. |
| `app/dashboard/` | Project list and “Add project” modal. |
| `app/admin/` | Admin-only overview (redirects if not admin). |
| `app/projects/[projectId]/` | Single project Kanban page. |
| `components/` | Reusable UI: layout shell, Kanban, task dialog, project cards, modals, shadcn-style primitives. |
| `services/api.js` | `fetch` wrapper: attaches JWT, handles errors. |
| `services/socket.js` | Socket.IO client: connects with token, join/leave project rooms. |
| `store/` | **Zustand** stores: `auth-store`, `project-store` (tasks, comments, optimistic updates). |
| `hooks/` | `use-auth-guard`, `use-project-socket`. |
| `lib/` | Constants (columns, priorities), workspace role helpers, `cn()` for Tailwind classes. |

---

## How the frontend talks to the backend

1. **REST** — `services/api.js` builds URLs like `` `${NEXT_PUBLIC_API_URL}/projects` `` and sends JSON + `Authorization: Bearer …`.  
2. **Sockets** — After login, `auth-store` connects the socket with the same token. On the project page, the app emits `project:join` so the server adds the tab to the correct room.  
3. **401 handling** — Failed auth may clear storage; see `api.js` and `auth-store` for behavior.

If the browser console shows **CORS** or **Network** errors, almost always the **backend URL** or **CORS_ORIGIN** on the server is wrong.

---

## Building for production

From `frontend/`:

```bash
npm run build
npm start
```

For deployment (Vercel, Netlify, Docker, etc.):

1. Set the same `NEXT_PUBLIC_*` variables in the host’s dashboard.  
2. They must point to your **public** API URL (HTTPS in production).  
3. Run `npm run build`; the host usually runs `npm start` or its Next.js integration.

---

---

## Workspace roles (what the UI changes)

| Your role (`user.role`) | Typical UI behavior |
|-------------------------|---------------------|
| `admin` | All projects; Admin nav link; can assign tasks to other admins; full people management. |
| `manager` | Can create projects; sees all projects; can manage project members; assignee list hides admins unless you are admin. |
| `member` | Sees only projects you belong to; cannot create projects; cannot assign tasks to workspace admins. |

Exact rules are enforced on the **server**; the UI hides some options to avoid mistakes.

---

## Related documentation

- **`../backend/README.md`** — Install MongoDB, `.env`, run API, seed admin.  
- **Root `README.md`** — Full API list, socket events, monorepo commands (`npm run install:all`, etc.).

---


Then open **http://localhost:3000**.

This README is written so someone who mainly uses the **frontend** can still run the app end-to-end; when in doubt, start the **backend** first and confirm **http://localhost:5000/api/health** works before debugging the UI.
