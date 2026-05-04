# Frontend

Next.js App Router frontend for ProjectFlow. It includes authentication pages, project dashboard, real-time Kanban board, task forms, comments, optimistic updates, rollback handling, responsive layout, and dark mode.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Scripts

- `npm run dev` starts the Next.js development server.
- `npm run build` builds the production app.
- `npm start` starts the production build.

## Structure

- `app` contains App Router pages and providers.
- `components` contains UI, layout, project, task, and Kanban components.
- `services` contains REST and Socket.IO clients.
- `store` contains Zustand state.
- `hooks` contains auth and project socket hooks.
- `lib` and `utils` contain shared constants and helpers.

