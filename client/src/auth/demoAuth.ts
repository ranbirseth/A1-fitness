import axios from "axios";
import http from "../api/http";
import { useAuthStore } from "../store/auth.store";

// Server-controlled DEMO MODE sign-in.
//
// While the backend runs with DEMO_MODE=true, POST /api/auth/demo-login
// returns a REAL access token + user for the seeded MAIN gym admin, using
// the exact same JWT pipeline as normal login (refresh cookie included).
// The client therefore never hardcodes any bypass: it simply asks the
// server whether demo mode is on. Setting DEMO_MODE=false on the server
// restores the normal login flow with no frontend rebuild/redeploy.
//
// - Runs at most once per page load, so an explicit Logout still lands on
//   the login page (until the visitor reloads).
// - On any failure it resolves false and the app falls back to the normal
//   login page.

let attempted = false;

export function tryDemoAutoLogin(): Promise<boolean> {
  const { user, accessToken } = useAuthStore.getState();
  if (user && accessToken) return Promise.resolve(true);
  if (attempted) return Promise.resolve(false);
  attempted = true;

  return axios
    .get(`${http.defaults.baseURL}/auth/demo-status`, { withCredentials: true })
    .then((res) => res?.data?.data?.demoMode === true)
    .then((demoEnabled) => {
      if (!demoEnabled) {
        attempted = false;
        return false;
      }
      console.info(
        "%c[A1 Fitness] DEMO MODE ACTIVE — signing in as the demo gym admin. Disable by setting DEMO_MODE=false on the server.",
        "color:#f59e0b;font-weight:bold"
      );
      return http.post("/auth/demo-login").then(({ data }) => {
        useAuthStore.getState().setAuth(data.data.user, data.data.accessToken);
        return true;
      });
    })
    .catch(() => {
      // Demo disabled or server unreachable: fall back to the normal flow.
      attempted = false;
      return false;
    });
}
