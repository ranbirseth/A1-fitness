import { login } from "../features/auth/auth.api";
import { useAuthStore } from "../store/auth.store";

// Development-only convenience bypass.
// import.meta.env.DEV is statically replaced by Vite: it is true only under
// `npm run dev` and false in every production build, which dead-code-eliminates
// this entire module from the shipped bundle. No production behavior changes.

export const DEV_BYPASS_ENABLED: boolean =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTOLOGIN !== "off";

const DEV_CREDENTIALS = {
  gymId: import.meta.env.VITE_DEV_GYM_ID || "MAIN",
  email: import.meta.env.VITE_DEV_LOGIN_EMAIL || "admin@gmail.com",
  password: import.meta.env.VITE_DEV_LOGIN_PASSWORD || "admin2026",
  role: import.meta.env.VITE_DEV_LOGIN_ROLE || "admin",
};

let attempted = false;

/**
 * Attempts a real login against /auth/login using the configured dev account,
 * filling the same auth store the normal LoginPage uses, so every downstream
 * feature (RBAC, refresh tokens, member profile fetches) behaves identically.
 *
 * - Runs at most once per page load, so an explicit Logout still lands on the
 *   login page (until the developer reloads).
 * - Resolves true immediately when a session already exists (persisted store).
 * - On failure it resolves false and the app falls back to the normal flow.
 */
export function tryDevAutoLogin(): Promise<boolean> {
  if (!DEV_BYPASS_ENABLED) return Promise.resolve(false);

  const { user, accessToken } = useAuthStore.getState();
  if (user && accessToken) return Promise.resolve(true);
  if (attempted) return Promise.resolve(false);
  attempted = true;

  console.info(
    `%c[A1 Fitness] DEV AUTH BYPASS — signed in as ${DEV_CREDENTIALS.email} (${DEV_CREDENTIALS.role}). Disable with VITE_DEV_AUTOLOGIN=off in client/.env.development`,
    "color:#a78bfa;font-weight:bold"
  );

  return login(DEV_CREDENTIALS)
    .then(({ data }) => {
      useAuthStore.getState().setAuth(data.data.user, data.data.accessToken);
      return true;
    })
    .catch(() => {
      console.warn(
        "[DEV AUTH BYPASS] auto-login failed (server down or credentials changed). Falling back to the normal login page."
      );
      attempted = false;
      return false;
    });
}
