/**
 * Temporary WhatsApp reminder flow debug logging (Phase 15).
 *
 * Prints a consistent `[WHATSAPP] -->` prefix so the reminder flow can be
 * traced from the request down to the Meta API call. Errors use
 * `[WHATSAPP] --> ERROR:` (recoverable step failure) and
 * `[WHATSAPP] --> BREAK:` (flow aborted).
 *
 * Disable everything by setting WHATSAPP_DEBUG=false. Nothing sensitive is ever
 * logged here: no access tokens, credentials, Authorization headers, passwords,
 * refresh tokens, or full phone numbers (use maskPhone for those).
 */

const ENABLED = String(process.env.WHATSAPP_DEBUG || "true").trim().toLowerCase() !== "false";

/** Normal flow log: `[WHATSAPP] --> ...` */
function log(...args) {
  if (ENABLED) console.log("[WHATSAPP] -->", ...args);
}

/** Step failed but the flow can continue: `[WHATSAPP] --> ERROR: ...` */
function error(...args) {
  if (ENABLED) console.error("[WHATSAPP] --> ERROR:", ...args);
}

/** Flow aborted at this step: `[WHATSAPP] --> BREAK: ...` */
function breakLog(...args) {
  if (ENABLED) console.error("[WHATSAPP] --> BREAK:", ...args);
}

/**
 * Mask a phone number for debug output: shows only the first 2 and last 2
 * digits, e.g. 919876543210 -> 91********10.
 */
function maskPhone(phone) {
  const digits = String(phone === null || phone === undefined ? "" : phone).replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 2)}${"*".repeat(digits.length - 4)}${digits.slice(-2)}`;
}

module.exports = { log, error, breakLog, maskPhone, enabled: ENABLED };