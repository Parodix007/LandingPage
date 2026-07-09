# calm_soft — landing page

Single-page marketing/lead-gen landing for calm_soft. Next.js 16 (App Router, full static
export to `out/`), Tailwind CSS v4, TypeScript strict, Vitest.

Commands: `npm run dev` / `typecheck` / `lint` / `test` / `build:mock` / `preview`.

`.env.development` enables the form mock for `next dev` only — gated builds use
`npm run build:mock`; a plain `npm run build` requires explicit env config (see `.env.example`).

See CLAUDE.md and docs/superpowers/specs/ for architecture and rules.
