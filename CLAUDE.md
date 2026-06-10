# CLAUDE.md — AppFlowy-Web (team fork)

Self-hosted **team-RBAC fork** of AppFlowy-Web (React/TS/Vite), branch `team-main`, AGPLv3.
Pairs with the sibling `../AppFlowy-Cloud` backend fork (its `TEAM_SELF_HOST.md` is the
cross-repo reference).

## Golden rule: additive, merge-clean changes

This fork periodically merges `upstream/main`. Keep that merge cheap:
- **New files over edits to shared upstream files.** RBAC UI is self-contained:
  `src/components/app/settings/{GroupsPanel,RolesPanel}.tsx`,
  `src/components/app/share/ObjectAccessManager.tsx`,
  `src/components/app/hooks/usePermissions.ts`,
  `src/application/services/.../http/{access,groups,roles}-api.ts`.
- When you must touch an upstream file (add a menu item, a settings tab), **confine edits to
  the insertion point and match the surrounding style.**
- Don't reformat/refactor adjacent code. Note unrelated dead code; don't delete it.

## How to work here

- **Think first** — state assumptions; surface a simpler path or multiple readings before coding.
- **Simplest thing that works** — no speculative abstractions or props that weren't asked for.
- **Goal-driven** — make the success check explicit and verify it (type-check + the real UI flow).

## Commands (pnpm — run before claiming done)

```bash
pnpm type-check     # tsc -p tsconfig.web.json
pnpm lint           # eslint (.eslintignore.web) + type-check
pnpm test           # jest
pnpm build          # vite production build

# Custom Docker image (served same-origin at localhost:80)
docker build -f docker/Dockerfile -t appflowyinc/appflowy_web:custom .
```

## Project specifics

- **Gate new admin UI with `useCan('<capability>')`** (`src/components/app/hooks/usePermissions.ts`).
  Capabilities: `page.{view,comment,edit,delete}`, `object.manage`, `member.manage`,
  `group.manage`, `role.manage`. It falls back to role defaults if the backend caps endpoint
  is unavailable.
- **`data-testid` (kebab-case) on interactive elements** — the Playwright MCP verification
  drives the UI by these.
- **Runtime config, not build-time:** read backend URLs via `getConfigValue(key)`
  (`src/utils/runtime-config.ts`), injected into `window.__APP_CONFIG__` by
  `docker/entrypoint.sh`. Don't hardcode `localhost:8000`.
- **Branding is config-driven** via `BRAND` (`src/application/brand.ts`) + `APPFLOWY_BRAND_*`
  env. Don't hardcode "AppFlowy" in new UI.
- **Backend pairing:** the web calls some older endpoint paths that the cloud fork serves via
  compat routes. If a call 404s, check the cloud fork's compat layer before changing the path.

## Verifying in the browser

Use the **Playwright MCP** against `http://localhost`. App login: `test@local.dev` /
`Password123!`. Style: ESLint clean, Prettier (printWidth 121, single quotes).

Last updated: June 10, 2026 11:17 NPT
