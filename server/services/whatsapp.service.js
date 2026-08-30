/**
 * WhatsApp delivery abstraction.
 *
 * No real provider is configured right now. The provider credentials / sender
 * number will be wired up later via environment variables (never committed).
 *
 * Until a provider is configured, sendMessage() reports `not_configured` and
 * never claims a message was actually delivered.
 */
class WhatsAppService {
  constructor() {
    this.providers = {
      twilio: { name: "Twilio WhatsApp", enabled: false, configured: false },
      meta: { name: "Meta WhatsApp Cloud API", enabled: false, configured: false },
      gupshup: { name: "Gupshup", enabled: false, configured: false },
      custom: { name: "Custom WhatsApp", enabled: false, configured: false }
    };
    this._activeProvider = null;
  }

  /**
   * Reads future provider configuration from environment variables.
   * Intentionally returns a "not configured" state until the operator sets
   * WHATSAPP_PROVIDER plus the provider's secret keys.
   */
  configureFromEnv() {
    const providerKey = (process.env.WHATSAPP_PROVIDER || "").trim().toLowerCase();
    const provider = this.providers[providerKey];
    if (!provider) {
      this._activeProvider = null;
      return this;
    }
    const enabled = String(process.env.WHATSAPP_ENABLED || "").trim().toLowerCase() === "true";
    // Mark the provider as "configured" only when it has been explicitly
    // enabled AND its required secret credential is actually present.
    // The credential env var names are provider-specific (added later).
    const secretPresent = Boolean(
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_AUTH_TOKEN ||
      process.env.WHATSAPP_API_KEY ||
      process.env.WHATSAPP_SID
    );
    provider.enabled = enabled;
    provider.configured = enabled && secretPresent;
    this._activeProvider = enabled && secretPresent ? providerKey : null;
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
   * Send a WhatsApp message.
   *
   * @param {object} opts
   * @param {string} opts.to          - Recipient phone number.
   * @param {string} opts.template    - Template name/id.
   * @param {object} opts.variables   - Template variables.
   *
   * @returns {Promise<{status: string, sent: boolean, reason?: string}>}
   */
  async sendMessage({ to, template, variables }) {
    this.configureFromEnv();
    if (!this.isConfigured() || !this._activeProvider) {
      return {
        status: "not_configured",
        sent: false,
        reason: "WhatsApp provider is not configured yet."
      };
    }

    // Real delivery would happen here via the active provider SDK (to be
    // implemented when credentials are supplied). We never fake a send.
    throw new Error(`WhatsApp provider "${this._activeProvider}" is enabled but its delivery driver is not implemented.`);
  }
}

module.exports = new WhatsAppService();
