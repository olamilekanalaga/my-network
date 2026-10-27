# Codex handoff — Network Intelligence MVP

## Goal and current state

Continue this implementation as a private personal relationship intelligence app. Preserve the economy-first distinction between documented needs, possible demand and agreed commercial work. A saved capability is not a funded order; a potential referral fee is not an entitlement.

This is a real application with editable demo persistence and authenticated server/database code. It is not a Figma or static screen specification. Start with `npm ci && npm run dev`, then follow the README's three journeys. Demo mode is functional without credentials.

## Architecture

Primary stack: Next.js App Router + TypeScript + React + Tailwind v4/global CSS; Supabase JS v2; Zod validation; PapaParse for CSV; Lucide icons. Exact installed versions are pinned in package-lock.json. OpenAI uses the documented Responses REST endpoint rather than an additional AI SDK/gateway dependency, matching the requested direct OpenAI API configuration.

The secondary Vite preview is an intentionally separate static demo build. It imports the same source components. Do not replace Next with Vite for the full app. The available Sites runtime is a static/Worker host, not a Node Next server. No fake server integrations are exposed in the hosted preview.

### Data flow

1. Without credentials, `useStore` reads versioned fictional demo data from localStorage.
2. A successful Supabase sign-in switches to live mode and loads this user's records; no automatic demo upload occurs.
3. All live CRUD passes through `/api/data/[table]`. Only an allowlisted table is accepted, Zod strips extra input keys, and the authenticated owner ID is set server-side.
4. Supabase's anon key + bearer token reach PostgREST, so RLS applies even if application code changes. `auth.getUser` verifies the JWT with Supabase for each API request.
5. Writes update local UI state only after a successful response. Errors appear in a banner or the import/assistant UI. Sequential imports can partially succeed; their error explains what was saved and retries detect duplicates.

### Schema

- `people`: rich profile fields, multi-category tags, skills, needs/capabilities, private notes, transcript, promises and source/verification.
- `organizations`: a discriminated Company / Community / Event record. Capabilities/products, needs, location and public website; event_date for events.
- `affiliations`: many-to-many person ↔ organisation with role.
- `relationships`: person or organisation endpoints, label, status and source. Ownership trigger prevents foreign-owner endpoints.
- `facts`: atomic source/date/confidence/visibility/status facts, pending until reviewed.
- `transactions`: a person can pay you or be paid by you; captures reciprocal business.
- `opportunities`: pipeline, nullable financial estimates/agreements, participants, notes, follow-up and outcome.
- `opportunity_people` / `opportunity_organizations`: normalised link tables automatically synchronised from the typed participant arrays for database queries and owner-scoped integrity.
- `activities`: in-app actions/reminders, related to a person and/or opportunity, completion state.

Composite owner/entity foreign keys prevent cross-account relationships even with a valid foreign record ID. Public-source facts are still private to their owning user under RLS. There are no public directory policies. The SQL graph function `relationship_paths` and client BFS are bounded and use confirmed edges only. Organisation membership is queryable but never silently converted into a personal introduction.

Capabilities and needs are currently text/skill fields, not dedicated ontological graph node tables. The assistant retrieves across these fields, approved facts and affiliation context. This delivers the example economic path without claiming a full knowledge-graph ontology or graph database engine.

### Evidence and intelligence

`terms()` normalises a small set of domain words; `retrieve()` ranks lexical overlap and expands actual confirmed relationships for coalition questions. Demo mode uses this engine deterministically. Connected mode uses the same candidate set then asks OpenAI to select candidates and return hypothesis/verification/next-step prose in strict JSON.

Recommendations contain programmatically attached original evidence and source IDs. Generated prose is explicitly a hypothesis. Unknown contact IDs reject model output. Model-generated summaries can still be wrong, especially if source notes are wrong or hostile; user review remains essential. A profile-level verification applies to its fields, while atomic facts carry individual verification/source metadata. For fine-grained provenance, migrate important profile assertions into facts instead of treating the whole profile as equally verified.

Current retrieval is suitable for a small personal network, not exhaustive semantic reasoning. It does not establish confidence-calibrated inference, legal suitability, affordability, personal willingness or introduction permission. It may overmatch generic terms such as UK and event. Every recommendation asks the user to verify scope, budget, capacity and consent.

Private notes default off for external retrieval. Capability/need/profile fields and approved non-private facts are eligible when AI is enabled. Disable AI or keep sensitive facts private if they should not leave the app. Do not present the app as zero-data-egress while OpenAI processing is enabled.

## Main source boundaries

- `components/workspace.tsx`: top-level navigation, lists/detail views, settings, simple relationship/fact/transaction/reminder forms.
- `components/forms.tsx`: richer person, opportunity and network record editors.
- `components/import-wizard.tsx`: select-all/per-record review, duplicate skip/merge, device and Google adapters, post-import enrichment.
- `components/assistant.tsx`: question UI, evidence cards, introduction paths and save-to-pipeline flow.
- `lib/store.ts`: transport/persistence boundary; keep all record mutations here.
- `lib/validation.ts`: validate both demo and API writes. Keep schema and SQL constraints aligned.
- `app/api/assistant/route.ts`: verified-user retrieval and OpenAI integration. Never accept an owner ID or a client-supplied network snapshot as authority.

## Feature status

Read `docs/FEATURE_CHECKLIST.md` for the implementation matrix. The concrete gaps include automatic AI public-fact extraction, direct social-platform API integrations, audio recording/transcription, full vCard photo/legacy encodings, account deletion, PWA/service worker, push/email reminders, vector search, exhaustive coalition optimisation, pagination beyond the small-network cap, and production rate/spend controls. These are not hidden behind fake working buttons.

Google OAuth and OpenAI call paths are real code, not a demo substitute, but were not credential-tested. Supabase Auth UI is implemented; automated API guards and actual PostgreSQL RLS were tested, while real Supabase provider login/session refresh remains a release verification step.

## Testing and observed environment limitations

`npm test` runs domain and API guard tests plus the actual migration on PGlite (embedded PostgreSQL). The RLS fixture creates auth.uid/auth.users and authenticated/anon roles. It substitutes only the extension line because PostgreSQL's built-in gen_random_uuid is available there. It verifies owner filtering, denied forged ownership, rejected cross-owner associations/edges/opportunity participants, real SQL graph paths, cascading cleanup, anonymous access and fee constraints.

`npm run typecheck`, `npm run build`, and `npm run preview:build` are the build gates. See `docs/TEST_RESULTS.md` for the final recorded result.

The environment preview daemon adds Vite CLI flags. `scripts/dev.mjs` adapts `--strictPort` to the static demo entry; ordinary local `npm run dev` launches Next. Initial managed Next preview encountered host runtime errors (`uv_resident_set_memory`) and a dev-origin warning, while the production build passed. Browser automation then rejected further navigation under its URL policy. Do not claim visual browser/mobile QA was completed or that screenshots were taken. `dist/mobile.html` provides actual responsive iframe previews for manual inspection. A live private static deployment does not verify provider integrations.

## Recommended next implementation tasks

1. Run manual iPhone/Safari and keyboard/screen-reader journeys. Check nested modal focus, file chooser, narrow screens and persistence, then capture real screenshots. Add a maintained browser E2E suite in a normal local environment.
2. Configure a dedicated Supabase test project. Exercise two real accounts, signup/email confirmation, Google linking and expiry, create/update/delete/export flows, and database migration deployment. Test transaction rollback and deletion with provider constraints.
3. Add distributed API rate limits/spend quotas before allowing broader AI access; consider audit logs, CSP, encryption options, backups/retention and a proper data-protection review. The app is production-oriented source, not a finished compliance package.
4. Replace full-small-network loading and lexical ranking with paginated search/fts + optional pgvector if measured quality requires it. Keep evidence IDs and ownership filters intact. Improve synonyms with judged examples rather than claiming universal understanding.
5. Add explicit need/request records (buyer, deadline, budget owner, evidence of spending), capability records, participant contribution/consent states and agreement records. These support a richer coalition graph and avoid storing all commercial reasoning in notes.
6. Add per-fact extraction from user-supplied public text with a strict schema, evidence spans and approval; do not scrape restricted platforms or promote pending facts automatically.
7. Add account self-deletion, optional audio-to-transcript, photo uploads with owner-scoped storage, a PWA manifest/service worker and opt-in notifications only if requested.

## Preserve these product rules

- Multi-category people and multi-organisation/event membership.
- Customers can be suppliers. Keep both payment directions visible.
- No automatic messages, contact disclosure or commission assumptions.
- Distinguish Confirmed / Publicly observed / Inferred, with evidence source/date.
- Public partnerships and event attendance do not prove personal access.
- Unknown monetary values remain null; hypotheses are not won deals.
- Keep the UI light, mobile-first, navy/white/blue; do not turn it into an overcrowded accounting CRM.

## Handoff prompt for Codex

“Open this repository and read README.md, CODEX_HANDOFF.md, docs/FEATURE_CHECKLIST.md and docs/TEST_RESULTS.md. Install with npm ci and run the tests/typecheck/build. Start the app in demo mode and manually verify journeys A/B/C before changing it. Preserve working features and the evidence/ownership boundaries. Report concrete failures, then implement the next requested change. Do not claim external integration tests passed without actually running them.”
