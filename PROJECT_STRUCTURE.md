# Gym Management System - Project Structure & Debugging Guide
# PROJECT_STRUCTURE - Gymza SaaS Gym Management System

## Full Folder Structure

```txt
gymza/
  README.md
  PROJECT_STRUCTURE.md
  server/
    .env.example
    package.json
    server.js
    config/
      db.js
      redis.js
      cloudinary.js
    models/
      user.model.js
      member.model.js
      plan.model.js
      payment.model.js
      attendance.model.js
      progress.model.js
      notification.model.js
      generic.model.js
      booking.model.js
    controllers/
      auth.controller.js
      member.controller.js
      trainer.controller.js
      plan.controller.js
      payment.controller.js
      attendance.controller.js
      dashboard.controller.js
      progress.controller.js
      notification.controller.js
      genericCrud.controller.js
      booking.controller.js
      referral.controller.js
    routes/
      auth.routes.js
      member.routes.js
      trainer.routes.js
      plan.routes.js
      payment.routes.js
      attendance.routes.js
      dashboard.routes.js
      progress.routes.js
      notification.routes.js
      generic.routes.js
      booking.routes.js
      referral.routes.js
    middlewares/
      auth.middleware.js
      error.middleware.js
    services/
      cache.service.js
      storage.service.js
    utils/
      asyncHandler.js
      response.js
      pagination.js
      tokens.js
    jobs/
      expiryReminder.job.js
    seeds/
      seed.js
  client/
    .env.example
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    public/
    src/
      main.tsx
      App.tsx
      api/
        http.ts
      features/
        auth/auth.api.ts
        members/members.api.ts
        plans/plans.api.ts
        payments/payments.api.ts
        attendance/attendance.api.ts
        dashboard/dashboard.api.ts
        bookings/bookings.api.ts
      components/
        ProtectedRoute.tsx
      pages/
        LoginPage.tsx
        DashboardPage.tsx
        MembersPage.tsx
        BookingsPage.tsx
        ProfilePage.tsx
      hooks/
        useSocket.ts
        useDebounce.ts
      store/
        auth.store.ts
      utils/
```

## Folder Explanations

- `server/config`: external systems bootstrap (Mongo, Redis, Cloudinary).
- `server/models`: database schemas and indexes.
- `server/controllers`: business logic per domain.
- `server/routes`: REST API mapping and authorization.
- `server/middlewares`: auth and global error handling.
- `server/validations`: zod schemas for request validation.
- `server/services`: reusable cross-domain logic (cache/storage).
- `server/utils`: low-level helper utilities.
- `server/jobs`: cron jobs (membership expiry reminders).
- `server/seeds`: dummy/demo data scripts.
- `client/src/api`: axios instance + token refresh handling.
- `client/src/features`: domain-oriented API modules.
- `client/src/components`: reusable UI wrappers (route protection).
- `client/src/pages`: page-level containers.
- `client/src/hooks`: custom hooks (Socket.IO).
- `client/src/store`: global state (auth session).

## API Route List

Base URL: `/api`

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
  - Uses secure cookie-based refresh token strategy

### Members
- `GET /members` (admin/trainer)
- `GET /members/search?q=...` (admin/trainer, designed for debounced UI search)
- `POST /members` (admin)
- `GET /members/profile/me` (member)
- `PATCH /members/profile/me` (member)
- `GET /members/:id` (admin/trainer/member)
- `PUT /members/:id` (admin/trainer)
- `DELETE /members/:id` (admin)
- `PATCH /members/:id/assign-plan` (admin/trainer)

### Trainers
- `GET /trainers` (admin)
- `POST /trainers` (admin)

### Plans
- `GET /plans` (authenticated)
- `POST /plans` (admin)
- `PUT /plans/:id` (admin)
- `DELETE /plans/:id` (admin)

### Payments
- `GET /payments` (admin/trainer)
- `GET /payments/dues` (admin/trainer)
- `GET /payments/:id/invoice` (admin/trainer/member)
- `POST /payments` (admin/trainer)
- `POST /payments/online/intent` (admin/trainer/member, mock)
- `POST /payments/online/confirm` (admin/trainer/member, mock)

### Attendance
- `GET /attendance` (admin/trainer)
- `POST /attendance/face-verify` (admin/trainer, placeholder API)
- `POST /attendance/check-in` (admin/trainer)
- `PATCH /attendance/check-out/:id` (admin/trainer)

### Progress
- `POST /progress` (admin/trainer)
- `GET /progress/:memberId` (admin/trainer/member)

### Dashboard
- `GET /dashboard/stats` (admin/trainer)

### Notifications
- `GET /notifications` (authenticated)
- `PATCH /notifications/:id/read` (authenticated)

### Bookings / Referrals
- `GET /bookings` (admin/trainer/member)
- `POST /bookings` (admin/trainer/member)
- `PATCH /bookings/:id/cancel` (admin/trainer/member)
- `GET /referrals` (admin/trainer)
- `POST /referrals/apply` (admin/trainer/member)

### Generic Intermediate/Advanced Modules
- `GET|POST /entities/:entity`
- `PUT|DELETE /entities/:entity/:id`
- `:entity` in:
  - `workout-plans`
  - `diet-plans`
  - `class-slots`
  - `inventory`
  - `branches`
  - `referrals`

## Data Flow

1. Frontend sends request through `client/src/api/http.ts`.
2. Access token is attached automatically.
3. Backend route receives request and runs:
   - `protect` middleware
   - `authorize` middleware (when needed)
   - controller logic
4. Controller queries Mongoose models and optional Redis service.
5. Response always returns the standard shape (`success`, `message`, `data`).
6. On `401`, frontend interceptor calls `/auth/refresh`, retries original request.

## How Authentication Works

1. Login/signup creates access + refresh token.
2. Access token is used for protected APIs.
3. Refresh token is stored in HttpOnly cookie + user document (`refreshTokens` array).
4. Expired access token triggers `/auth/refresh` in frontend interceptor with credentials.
5. Backend validates refresh token signature and token existence in DB.
6. New access/refresh tokens are issued and request is retried.

## Debugging Guide by Module

### Auth
- Confirm `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`.
- If refresh fails, inspect `user.refreshTokens` and token payload `sub`.

### Members/Plans
- Validate plan IDs exist before assignment.
- Use Mongo shell/Compass to verify `membershipExpiryDate` values.

### Payments
- Confirm `status` is either `paid` or `pending`.
- Check invoice generation in saved `invoice` object.

### Attendance + Realtime
- Verify client Socket.IO URL and server CORS origin.
- Inspect socket events: `attendance:checkin`, `attendance:checkout`.

### Dashboard + Redis
- If stale values appear, reduce cache TTL in `dashboard.controller.js`.
- If Redis unavailable, app still works without caching.

### Cron Notifications
- Verify server process stays alive for cron execution.
- Ensure member `isActivePlan` and expiry date are correctly set.

## Common Errors and Fixes

- **Mongo connection refused**: start MongoDB and check `MONGO_URI`.
- **Redis errors on startup**: verify `REDIS_URL` or disable Redis instance.
- **401 Unauthorized**: token missing/expired; re-login or refresh.
- **403 Forbidden**: user role lacks route permission.
- **CORS blocked**: set `CLIENT_ORIGIN` to your frontend URL.
- **Socket not connecting**: ensure backend uses same host/port and open firewall port.
This document explains the architecture, data flow, and debugging strategies for the multi-tenant SaaS Gym Management System.

## Architecture Overview

The application follows a standard MERN MVC architecture, enhanced with Service layers, Redis caching (with fallback), and real-time Socket.io notifications. It supports multi-tenancy by scoping all major entities to a `gymId`.

```
/gymza
├── /client                # React + Vite + TypeScript Frontend
│   ├── /src
│   │   ├── /api           # Axios instances and endpoint configurations
│   │   ├── /components    # Reusable unstyled HTML components
│   │   ├── /features      # Domain modules (Auth, Members, etc.)
│   │   ├── /hooks         # React custom hooks
│   │   ├── /pages         # Route views
│   │   ├── /store         # Zustand state management
│   │   └── /utils         # Formatting and helper functions
│   └── package.json
│
├── /server                # Node.js + Express Backend
│   ├── /config            # MongoDB, Redis, Multer, Socket setup
│   ├── /controllers       # Request/Response logic
│   ├── /jobs              # Node-cron background jobs
│   ├── /middlewares       # Auth, role-checks, global error handlers
│   ├── /models            # Mongoose Schemas (with gymId indexing)
│   ├── /routes            # Express API routers
│   ├── /services          # Core business logic and DB queries
│   ├── /utils             # Response formatters, logger
│   ├── /uploads           # Local storage for images
│   ├── server.js          # Entry point
│   └── package.json
└── PROJECT_STRUCTURE.md
```

## Data Flow
1. **Request Lifecycle**: Client makes an HTTPS request -> Express Router -> Middleware (Auth/Role Check) -> Controller -> Service -> Model (MongoDB) -> Response.
2. **Multi-Tenancy**: Every request made by a logged-in user includes their `gymId` embedded in the JWT. The backend uses this `gymId` to filter DB queries and scope Socket.io emission channels (`io.to(gymId)`).
3. **Caching**: The Service layer checks Redis. If Redis is down (fallback active) or cache misses, it queries MongoDB and updates the cache (if Redis is available).
4. **Authentication**: 
   - Login creates an `accessToken` (returned in JSON) and a `refreshToken` (set as an `httpOnly` secure cookie).
   - The React frontend stores the `accessToken` in Zustand memory state.
   - Axios interceptors automatically attach the `accessToken` and catch 401s to hit the `/refresh` endpoint when needed.

## API Routes Index (Backend)

| Route Prefix | Purpose | Security Level |
|---|---|---|
| `/api/auth` | Login, Register, Refresh Token, Logout | Public / Basic Auth |
| `/api/users` | Manage internal staff (Admins, Trainers) | Admin |
| `/api/members` | CRUD operations for gym members | Admin/Trainer |
| `/api/plans` | Gym membership plans and pricing | Admin |
| `/api/payments` | Record fee payments and invoices | Admin |
| `/api/attendance`| Check-in/out logging | Admin/Trainer/Member |
| `/api/dashboard` | Aggregated statistics for charts | Admin |

## How to Debug

### Backend Debugging
1. **Logs**: Check the console. `morgan` logs all incoming HTTP requests. Errors are caught by the `globalErrorHandler` and printed cleanly.
2. **Redis Failures**: The application uses a fallback mechanism. If Redis fails, a warning logs once, and all requests proceed normally via MongoDB.
3. **Postman/Insomnia Testing**:
   - First, hit `/api/auth/login`.
   - Copy the `data.accessToken` and put it in your `Bearer Token` authorization header.
   - The `refreshToken` cookie is automatically set in Postman.
4. **Socket.io**: Client connections emit a `join_gym` event with their `gymId`. Ensure you see the server log confirming the client successfully joined their tenant room.

### Frontend Debugging
1. **Zustand Devtools**: If state is not updating, check the Zustand store in React Devtools.
2. **Axios Interceptors**: Open the browser's Network tab. If an API call explicitly fails with a `401 Unauthorized`, verify that the `/api/auth/refresh` call was triggered automatically by the interceptor.
3. **Multi-Tenancy**: Ensure the UI never mixes data. A member created by Admin A (Gym 1) should never appear on Admin B (Gym 2)'s dashboard.

## Common Errors & Fixes
- **`TokenExpiredError`**: The access token died. If the refresh token also expired, you will be violently logged out.
- **`Cast to ObjectId failed`**: You passed a poorly formatted ID string to Mongoose. Check your route params.
- **Redis Connection Error**: Ensure Redis is running (e.g., `redis-server`). If not, ignore the warning logs; the app will fallback to no-cache mode.
- **CORS Blocked**: React is running on port 5173, and Express on port 5000. Ensure `cors` middleware allows credentials and the Vite origin.
