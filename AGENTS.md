# AGENTS.md

## Layout

- Two independent npm packages, NOT npm workspaces: `server/` (Express + Mongoose, CommonJS) and `client/` (React 18 + Vite + TypeScript + Zustand). Each has its own `package.json`/`node_modules` — install and run commands inside the package dir.
- Root `package.json` is deploy glue only; its scripts re-run `npm install --prefix` on every invocation. Run server/client directly instead.

## Commands

- Backend: `cd server && npm run dev` (nodemon). Starts on 5000, auto-falls back to 5001–5004 if busy — read console for the real port.
- Frontend: `cd client && npm run dev` (Vite, port 5173).
- Reseed DB manually: `cd server && npm run seed`.
- Typecheck/build client: `cd client && npm run build` (= `tsc -b && vite build`). This is the repo's ONLY static check — there is no test suite, lint, or formatter config.
- Verify backend is up: `GET http://localhost:<port>/api/health` (reports db status, user count, admin existence).

## Client gotcha: duplicated .js/.ts files

- Almost everything in `client/src` exists twice: stale `.js(x)` copies committed next to the live `.ts(x)` versions (e.g. `api/http.js` vs `api/http.ts`, every page, hooks, stores). The intended entry chain is `main.tsx` → `App.tsx` → lazy-loaded `pages/*.tsx`.
- The `.js` twins have drifted from their `.ts` counterparts, so editing the wrong one silently changes nothing (or worse, changes the copy that isn't type-checked). Always edit the `.ts`/`.tsx` version.
- Note: Vite's default extension resolution prefers `.js` over `.ts`, so wherever both exist the runtime may load the `.js` copy while `tsc -b` checks only the `.ts` copy — after edits, confirm the change actually shows up in the browser.

## Auth, RBAC, branches

- JWT access + refresh tokens. Correct env names: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (README.md and DEPLOY.md list stale names like `JWT_SECRET` — trust the code).
- Login body requires `{ gymId, email, password }` plus a role selector. Seeded admin: `admin@gmail.com` / `admin2026`, gymId `MAIN`. (LOCAL_SETUP.md's `admin@gymza.com` / `Password123` is outdated.)
- Permission checks live in `authorize()` in `server/middlewares/auth.middleware.js`: a role→permission-string map for admin/trainer/member; `superadmin` bypasses everything. New protected routes need matching permission strings there.
- Multi-branch: `branchScope.middleware.js` force-injects `branchCode` into `req.query` for non-superadmins (locked to their own branch, default `MAIN`); superadmin filters via `?branchCode=ALL`.

## Server quirks

- `server/.env` is gitignored but preconfigured for localhost. Mongo falls back to `mongodb://127.0.0.1:27017/gymza`; the server still boots (degraded) when MongoDB is unreachable.
- An empty database auto-seeds on startup via `seeds/seedLogic.js` (same logic as `npm run seed`).
- Optional services degrade gracefully: Redis only connects when `REDIS_URL` is set (else in-memory cache); Cloudinary activates only with `USE_CLOUDINARY=true`, otherwise uploads write to `server/uploads/`.
- CORS origins are hard-coded in `server/server.js` (`localhost:5173` + prod Vercel URL) plus `CLIENT_ORIGIN` extras — a new frontend origin must be added there or requests get blocked.
- QR attendance geo-fence reads `GYM_LATITUDE`, `GYM_LONGITUDE`, `GYM_LOCATION_RADIUS_METERS`.
- Simple entities (class-slots, inventory, etc.) use the generic CRUD factory mounted at `/api/entities` (`generic.routes.js` + `makeCrud`), not bespoke routes.

## Deploy

- Render hosts the backend; `render.yaml` is production-only config. With `NODE_ENV=production` or `RENDER` set, Express serves `client/dist` and SPA-fallbacks all non-`/api` routes.
- Prose docs (`README.md`, `DEPLOY.md`, `LOCAL_SETUP.md`) contain stale env names/credentials; `RBAC_GUIDE.md` and `ER_DIAGRAM.md` are accurate as of writing — verify against code when they conflict.
