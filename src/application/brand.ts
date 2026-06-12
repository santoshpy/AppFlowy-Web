/**
 * Centralized brand configuration.
 *
 * All product-identity strings flow through this module so the app can be
 * rebranded by setting `APPFLOWY_BRAND_*` environment variables (exposed to the
 * client via Vite's `envPrefix: ['APPFLOWY']`) — no scattered code edits.
 *
 * Defaults carry the Abhilekh identity (अभिलेख — Nepal's national document
 * platform). Every value can still be overridden per-deployment via the env
 * vars below (and the matching `{{BRAND_*}}` placeholders are substituted into
 * `index.html` by the `brandHtmlPlugin` in `vite.config.ts`). The env-var names
 * keep the `APPFLOWY_` prefix only because it's the build's reserved
 * `envPrefix`; it is not a brand string.
 */

const env = import.meta.env;

const url = env.APPFLOWY_BRAND_URL ?? 'https://abhilekh.app';

export const BRAND = {
  /** Product name shown in titles, the sidebar, dialogs, etc. */
  name: env.APPFLOWY_BRAND_NAME ?? 'Abhilekh',
  /** One-line description used in meta tags / marketing copy. */
  description:
    env.APPFLOWY_BRAND_DESCRIPTION ??
    "Abhilekh — Nepal's national platform for managing documents and records across government departments",
  /** Canonical site URL. */
  url,
  /** Twitter/X handle (including the leading @); blank disables social links. */
  twitter: env.APPFLOWY_BRAND_TWITTER ?? '',
  /** Support contact address shown on error/landing pages. */
  supportEmail: env.APPFLOWY_BRAND_SUPPORT_EMAIL ?? 'support@abhilekh.app',
  /** Legal pages. */
  termsUrl: env.APPFLOWY_BRAND_TERMS_URL ?? `${url}/terms`,
  privacyUrl: env.APPFLOWY_BRAND_PRIVACY_URL ?? `${url}/privacy`,
  /** Help/documentation home. */
  docsUrl: env.APPFLOWY_BRAND_DOCS_URL ?? `${url}/docs`,
} as const;

export type Brand = typeof BRAND;
