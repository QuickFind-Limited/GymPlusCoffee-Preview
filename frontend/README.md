# Gym+Coffee Frontend

A Vite + React + TypeScript application that powers the Gym+Coffee internal tools and integrations. The UI talks to the Supabase project configured in `.env` alongside the Python backend for more advanced workflows (Odoo sync, NetSuite clarifications, etc.).

## Tech Stack
- React 18 with TypeScript and Vite
- Tailwind CSS + Radix UI component primitives
- TanStack Query for data fetching
- Supabase client SDK for auth and data access

## Quick Start
1. Install Node.js 20+.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Copy the example environment file and fill in the values:
   ```bash
   cp .env.example .env
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

The app will be available on the port defined in your `.env` (defaults to the configured port 3002).

## Environment
- `VITE_SUPABASE_URL` – Supabase project URL (https://<project>.supabase.co).
- `VITE_SUPABASE_ANON_KEY` – Supabase anon key for client requests.
- `VITE_API_BASE_URL` – Base URL for the Python backend (e.g. http://localhost).
- `VITE_API_PORT` – Port exposed by the backend (default 8000).

## Common Scripts
- `npm run dev` – launch the local development server.
- `npm run build` – generate a production build in `dist/`.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run ESLint over the source files.
- `npm run test` / `npm run test:coverage` – execute the Vitest suite (optionally with coverage).

Refer to `package.json` for additional helper scripts (import automation, etc.).

## Documentation
Supporting notes and historical references now live under [`docs/`](docs/). Promote anything that becomes active knowledge into a dedicated guide and link it from this README.
