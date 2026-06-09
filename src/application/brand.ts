/**
 * Centralized brand configuration.
 *
 * All product-identity strings flow through this module so the app can be
 * rebranded by setting `APPFLOWY_BRAND_*` environment variables (exposed to the
 * client via Vite's `envPrefix: ['APPFLOWY']`) — no scattered code edits.
 *
 * Defaults preserve the upstream AppFlowy identity, which keeps this file
 * mergeable with upstream and means an unconfigured build behaves exactly as
 * stock AppFlowy. To rebrand, set the env vars in `dev.env` / `deploy.env`
 * (and the matching `%APPFLOWY_BRAND_*%` placeholders are substituted into
 * `index.html` by the `brandHtmlPlugin` in `vite.config.ts`).
 */

const env = import.meta.env;

export const BRAND = {
  /** Product name shown in titles, the sidebar, dialogs, etc. */
  name: env.APPFLOWY_BRAND_NAME ?? 'AppFlowy',
  /** One-line description used in meta tags / marketing copy. */
  description:
    env.APPFLOWY_BRAND_DESCRIPTION ??
    'AppFlowy is an AI collaborative workspace where you achieve more without losing control of your data',
  /** Canonical marketing/site URL. */
  url: env.APPFLOWY_BRAND_URL ?? 'https://appflowy.com',
  /** Twitter/X handle (including the leading @). */
  twitter: env.APPFLOWY_BRAND_TWITTER ?? '@appflowy',
} as const;

export type Brand = typeof BRAND;
