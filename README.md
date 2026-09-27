# poc-frontend

MartDesk cashier and admin web app: React Router 7 in SPA mode (`ssr: false`), TypeScript strict, Tailwind, Dexie, PWA.

## Setup

```
pnpm install
cp .env.example .env
```

`VITE_API_BASE_URL` in `.env` points at the backend, which runs from its own repository.

## Commands

```
pnpm run dev              # development server
pnpm run test             # vitest (unit and component tests)
pnpm run lint             # eslint
pnpm run typecheck        # tsc --noEmit
pnpm run format:check     # prettier
pnpm run build            # production build
```

## Layout

Inside `app/`: `domain/` (pure functions), `use_cases/` (one function per user action), `infrastructure/` (API client, Dexie, print, storage), `routes/` and `components/` (presentation only), `i18n/` (English string layer), `styles/`.
