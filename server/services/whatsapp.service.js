/**
 * WhatsApp delivery abstraction backed by the Meta WhatsApp Cloud API.
 *
 * Configuration is environment-based only (never committed):
 *   WHATSAPP_PROVIDER=meta              (only "meta" has a real driver)
 *   WHATSAPP_ENABLED=true|false         (explicit "false" disables; default enabled)
 *   WHATSAPP_ACCESS_TOKEN              (Meta system-user / permanent access token)
 *   WHATSAPP_PHONE_NUMBER_ID           (business phone number id for outgoing sends)
 *   WHATSAPP_BUSINESS_ACCOUNT_ID       (optional, informational)
 *   WHATSAPP_API_VERSION               (default "v21.0")
 *   WHATSAPP_TEMPLATE_NAME             (default "a1_fitness_membership_reminder")
 *   WHATSAPP_TEMPLATE_LANGUAGE         (default "en")
 *   WHATSAPP_COUNTRY_CODE              (default "91" - Indian gym numbering)
 *
 * Behaviour contract:
 *  - Missing credentials: returns { status: "not_configured" } WITHOUT touching
 *    the network and never claims a message was delivered.
 *  - `sent` is ONLY true when Meta returned a message id for this request.
 *  - Provider failures return { status: "failed" } with a sanitized error that
 *    never contains the access token.
 *  - Recipient numbers are normalized to E.164; ambiguous numbers are rejected
 *    rather than silently corrupted.
 */

const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_NAME = "a1_fitness_membership_reminder";
const DEFAULT_TEMPLATE_LANGUAGE = "en";
const DEFAULT_COUNTRY_CODE = "91";

const dbg = require("../utils/whatsappDebug");

/**
 * Build the Meta Cloud API JSON body for a template message.
 * Exposed as a pure function so tests can assert the exact wire shape.
 */
function buildTemplateMessage({ to, templateName, languageCode, parameters }) {
  const name = String(templateName || DEFAULT_TEMPLATE_NAME).trim();
  const lang = String(languageCode || DEFAULT_TEMPLATE_LANGUAGE).trim();
  const params = Array.isArray(parameters)
    ? parameters.map((value) => ({ type: "text", text: String(value === null || value === undefined ? "" : value) }))
    : [];

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: String(to),
    type: "template",
    template: {
      name,
      language: { code: lang },
      components: [{ type: "body", parameters: params }]
    }
  };
}

/**
 * Normalize an Indian gym phone number to an E.164 digit string (no "+").
 *
 * Accepted input forms:
 *   "+91 98765 43210" / "91 98765 43210"  -> 12-digit "91..." kept
 *   "9876543210" (or "0 9876543210")      -> country code prefixed
 *   "919876543210"                        -> already E.164 local, kept
 *
 * Ambiguous/foreign numbers (e.g. an 11-digit Indian number, a number with a
 * country code different from WHATSAPP_COUNTRY_CODE) return null instead of
 * being guessed - we never silently corrupt or invent recipient numbers.
 *
 * @param {string|number} phone
 * @returns {string|null} E.164 digits or null when it cannot be normalized safely.
 */
function normalizePhoneNumber(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  if (phone === null || phone === undefined) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  const cc = String(countryCode || DEFAULT_COUNTRY_CODE).replace(/^\+/, "");
  if (!/^\d+$/.test(cc)) return null;

  // "0" prefix is a local dialling prefix, not part of the number.
  while (digits.length > 10 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return cc + digits;
  }
  if (digits.length === 12 && digits.startsWith(cc)) {
    return digits;
  }
  return null;
}

/**
 * Structural E.164 check for the recipient field Meta will receive:
 * numeric, 11-15 digits, no leading zero. Everything else is rejected.
 */
function validatePhoneNumber(normalizedPhone) {
  return typeof normalizedPhone === "string" && /^[1-9]\d{10,14}$/.test(normalizedPhone);
}

/**
 * Sanitize a Meta API failure into a log-safe message. Redacts the access token
 * even when Meta echoes it back inside its error body, truncates the message,
 * and never includes the Authorization header.
 */
function sanitizeMetaError(status, body, tokenToRedact) {
  let message =
    (body && typeof body === "object" && body.error && typeof body.error.message === "string" && body.error.message.trim()) ||
    "WhatsApp API request failed";
  if (tokenToRedact) {
    message = message.split(String(tokenToRedact)).join("[REDACTED]");
  }
  const truncated = message.length > 200 ? `${message.slice(0, 200)}…` : message;
  return `${status ? `HTTP ${status}: ` : ""}${truncated}`;
}

class WhatsAppService {
  /**
   * @param {object} [opts]
   * @param {Function} [opts.env]    - Env lookup; defaults to process.env (tests inject a stub).
   * @param {Function} [opts.fetch]  - fetch implementation; defaults to globalThis.fetch (tests inject a mock).
   */
  constructor(opts = {}) {
    this.env = opts.env || process.env;
    this._fetch =
      opts.fetch || (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null);
    this.providers = {
      meta: { name: "Meta WhatsApp Cloud API", enabled: false, configured: false }
    };
    this._activeProvider = null;
  }

  get(name) {
    const value = this.env[name];
    return value === undefined || value === null ? "" : String(value);
  }

  /** @returns {string|null} The Meta access token, or null when absent. */
  getAccessToken() {
    const token = this.get("WHATSAPP_ACCESS_TOKEN").trim();
    return token || null;
  }

  getPhoneNumberId() {
    return this.get("WHATSAPP_PHONE_NUMBER_ID").trim() || null;
  }

  getApiVersion() {
    const v = this.get("WHATSAPP_API_VERSION").trim();
    return (v || DEFAULT_API_VERSION).replace(/^v/, "v");
  }

  getTemplateName() {
    return this.get("WHATSAPP_TEMPLATE_NAME").trim() || DEFAULT_TEMPLATE_NAME;
  }

  getTemplateLanguage() {
    return this.get("WHATSAPP_TEMPLATE_LANGUAGE").trim() || DEFAULT_TEMPLATE_LANGUAGE;
  }

  getCountryCode() {
    return this.get("WHATSAPP_COUNTRY_CODE").trim().replace(/^\+/, "") || DEFAULT_COUNTRY_CODE;
  }

  /** Instance helper so services can normalize numbers with the configured country code. */
  normalizePhoneNumber(phone) {
    return normalizePhoneNumber(phone, this.getCountryCode());
  }

  /** Instance helper for the structural E.164 validation. */
  validatePhoneNumber(normalizedPhone) {
    return validatePhoneNumber(normalizedPhone);
  }

  /**
   * Re-read provider configuration from the environment.
   * A provider is "configured" only when explicitly selected AND its required
   * secrets are actually present.
   */
  configureFromEnv() {
    const providerKey = (this.get("WHATSAPP_PROVIDER") || "").trim().toLowerCase();
    const explicitlyDisabled = this.get("WHATSAPP_ENABLED").trim().toLowerCase() === "false";

    if (providerKey !== "meta" || explicitlyDisabled) {
      this.providers.meta.enabled = providerKey === "meta";
      this.providers.meta.configured = false;
      this._activeProvider = null;
      return this;
    }

    const token = this.getAccessToken();
    const phoneNumberId = this.getPhoneNumberId();
    const configured = Boolean(token && phoneNumberId);

    this.providers.meta.enabled = true;
    this.providers.meta.configured = configured;
    this._activeProvider = configured ? "meta" : null;
    return this;
  }

  isConfigured() {
    this.configureFromEnv();
    return Boolean(this._activeProvider);
  }

  getStatus() {
    this.configureFromEnv();
    return {
      configured: this.isConfigured(),
      activeProvider: this._activeProvider ? this.providers[this._activeProvider].name : null,
      availableProviders: Object.entries(this.providers).map(([key, val]) => ({
        key,
        name: val.name,
        enabled: val.enabled,
        configured: val.configured
      }))
    };
  }

  /**
   * Send a Meta WhatsApp template message.
   *
   * @param {object} opts
   * @param {string} opts.to            - Recipient phone (raw; normalized internally).
   * @param {string} [opts.templateName] - Meta-approved template name.
   * @param {string} [opts.languageCode] - Template language code.
   * @param {Array<string|number>} [opts.parameters] - Template body parameters in order {{1..N}}.
   *
   * @returns {Promise<{status: string, sent: boolean, reason?: string, provider?: string, metaMessageId?: string, metaErrorCode?: number|null}>}
   *   status: "sent" | "not_configured" | "invalid_phone" | "failed"
   */
  async sendTemplateMessage({ to, templateName = this.getTemplateName(), languageCode = this.getTemplateLanguage(), parameters = [] }) {
    this.configureFromEnv();

    if (!this._activeProvider) {
      dbg.log("whatsapp.service config check -> NOT CONFIGURED (set WHATSAPP_PROVIDER=meta, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID); no request sent");
      return {
        status: "not_configured",
        sent: false,
        provider: "meta",
        reason: "WhatsApp is not configured. Set WHATSAPP_PROVIDER=meta, WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
      };
    }
    dbg.log("whatsapp.service config check -> configured (Meta Cloud API active)");

    const normalized = normalizePhoneNumber(to, this.getCountryCode());
    if (!normalized || !validatePhoneNumber(normalized)) {
      dbg.error(`whatsapp.service recipient validation -> invalid_phone (raw=${dbg.maskPhone(to)}); no request sent`);
      return {
        status: "invalid_phone",
        sent: false,
        provider: "meta",
        reason: "Recipient phone number could not be validated as an E.164 number."
      };
    }
    dbg.log(`whatsapp.service recipient validation -> ok (E.164 ${dbg.maskPhone(normalized)})`);

    if (!this._fetch) {
      dbg.error("whatsapp.service -> delivery driver unavailable (fetch not found in runtime)");
      return {
        status: "failed",
        sent: false,
        provider: "meta",
        reason: "WhatsApp API driver unavailable (fetch not found in this runtime)."
      };
    }

    const url = `https://graph.facebook.com/${this.getApiVersion()}/${encodeURIComponent(this.getPhoneNumberId())}/messages`;
    const payload = buildTemplateMessage({ to: normalized, templateName, languageCode, parameters });
    const headers = {
      Authorization: `Bearer ${this.getAccessToken()}`,
      "Content-Type": "application/json"
    };

    dbg.log(`whatsapp.service -> sending request to Meta API (template=${templateName}, lang=${languageCode}, params=${parameters.length})`);
    try {
      const response = await this._fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body && Array.isArray(body.messages) && body.messages[0] && body.messages[0].id) {
        dbg.log(`whatsapp.service -> Meta API response OK (status=${response.status}, templateMessageId=${body.messages[0].id})`);
        return {
          status: "sent",
          sent: true,
          provider: "meta",
          metaMessageId: body.messages[0].id,
          metaErrorCode: null
        };
      }

      // Meta returned an error (or a non-JSON 2xx): never claim delivery.
      const errCode = body && body.error && typeof body.error.code === "number" ? body.error.code : null;
      dbg.error(`whatsapp.service -> Meta API returned an error (status=${response.status}${errCode ? `, metaErrorCode=${errCode}` : ""})`);
      return {
        status: "failed",
        sent: false,
        provider: "meta",
        reason: sanitizeMetaError(response.status, body, this.getAccessToken()),
        metaErrorCode: errCode
      };
    } catch (error) {
      dbg.breakLog("whatsapp.service -> Meta API request failed (network/transport error)", error && error.message);
      return {
        status: "failed",
        sent: false,
        provider: "meta",
        reason: "WhatsApp API request failed (network/transport error).",
        metaErrorCode: null
      };
    }
  }

  /**
   * Backward-compatible wrapper around sendTemplateMessage.
   * `variables` (object) is flattened into ordered body parameters.
   */
  async sendMessage({ to, template, variables }) {
    const parameters = variables && typeof variables === "object" ? Object.values(variables) : [];
    return this.sendTemplateMessage({ to, templateName: template, parameters });
  }
}

module.exports = new WhatsAppService();
module.exports.buildTemplateMessage = buildTemplateMessage;
module.exports.normalizePhoneNumber = normalizePhoneNumber;
module.exports.validatePhoneNumber = validatePhoneNumber;
module.exports.sanitizeMetaError = sanitizeMetaError;
module.exports.WhatsAppService = WhatsAppService;
module.exports.DEFAULTS = {
  DEFAULT_API_VERSION,
  DEFAULT_TEMPLATE_NAME,
  DEFAULT_TEMPLATE_LANGUAGE,
  DEFAULT_COUNTRY_CODE
};