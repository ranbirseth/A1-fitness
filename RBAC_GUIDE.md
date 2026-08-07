# Gymza RBAC System Documentation

## Overview
The Gymza system now uses a permission-based Role-Based Access Control (RBAC) system. Roles are mapped to specific permissions, which are then validated at the API route level.

## Roles & Permissions

### Superadmin
- Has full bypass on all permission checks.
- Inherits all administrative and trainer capabilities.

### Admin
- **Workouts**: `create_workout`, `assign_workout`, `delete_workout`, `view_workout`
- **Diets**: `create_diet`, `assign_diet`, `delete_diet`, `view_diet`
- **Members**: `create_member`, `delete_member`, `update_member`, `view_member`, `approve_member`, `manage_plans`
- **Financials**: `view_payments`, `manage_payments`

### Trainer
- **Workouts**: `create_workout`, `assign_workout`, `view_workout`, `delete_workout`
- **Diets**: `create_diet`, `assign_diet`, `view_diet`, `delete_diet`
- **Members**: `create_member`, `delete_member`, `update_member`, `view_member`, `approve_member`, `manage_plans`

### Member
- **Access**: `view_own_data` (Profile, assigned workouts, assigned diets)

## Backend Implementation
Permissions are enforced using the `authorize` middleware in `server/middlewares/auth.middleware.js`.

Example usage in routes:
```javascript
router.post("/templates", authorize("create_workout"), createWorkoutTemplate);
```

## Frontend Enforcement
Conditional rendering in the frontend (`MembersPage.tsx`, `WorkoutsPage.tsx`) now checks for both `isAdmin` and `isTrainer` roles to ensure UI elements like "Add Member" or "Create Workout" are visible to trainers.

## Member List Filtering
The member list now includes a status filter dropdown that updates the list in real-time without requiring a page reload. This is implemented via state-driven API calls in `MembersPage.tsx`.
