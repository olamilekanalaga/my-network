# Network Intelligence

A functional, mobile-first personal relationship workspace. Next.js + TypeScript + Tailwind CSS, Supabase PostgreSQL/Auth/RLS, and a server-side OpenAI Responses API integration.

**Start here: demo mode needs no accounts or API keys.** All seeded people, companies, events, transactions and conversations are fictional. Demo edits are saved in your browser, not a private cloud vault. Use the connected mode before entering sensitive real-world records.

## Run locally

Requirements: Node.js 22.12+ (tested on 24.22.1), npm, and an internet connection for the first dependency install.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The app starts in the fictional demo. To use another port: `npm run dev -- --port 3001`.

```bash
npm test
npm run typecheck
npm run build
npm start
```

No `.env.local` is needed for the demo. Do not run `npm start` until `npm run build` succeeds. Windows/macOS/Linux are supported by these Node-based scripts; no Bash setup script is required. The ZIP excludes node_modules and build caches.

## Try the complete journeys

### A. Import → select → enrich

1. Open People → Import, or Home → Import contacts.
2. Upload `public/sample-contacts.csv` or `public/sample-contacts.vcf`.
3. Select Nia and Tunde; deselect the existing Maya record, or choose merge to fill existing blank fields without replacing saved context.
4. Import → Add context beside Nia. Add services, needs, where you met, professional links and any additional categories. Save.
5. Find Nia in People, edit again and reload to confirm persistence.

VCF support: vCard 3/4 common FN/N/EMAIL/TEL/TITLE/URL fields, folded lines and escaped text. Legacy quoted-printable/binary/photo vCards and custom Google CSV column mappings are not fully supported. Review the preview before importing. Limits: 5 MB and 2,000 contacts per CSV/VCF import.

### B. Find a service → evidence → opportunity

1. On Home select “Who can print 5,000 event materials in London?”
2. Open Maya’s recommendation, review saved profile evidence and its source IDs. Maya is both a customer and a supplier.
3. Review the direct “You → Maya” path. This means she is in your saved contacts, not that she has consented to an introduction.
4. Save as opportunity. Choose participants/organisations, a follow-up date and Researching. Leave unknown amounts empty. Save.
5. Open Opportunities, update to Introduction Requested and record your next step. Nothing is sent to anyone.

### C. Discover a coalition → verify → track

1. On Home ask “Build a coalition to help a Nigerian fintech expand into the UK.”
2. Explore Amara, Ethan, Sophie and other lexical matches. Each card separates saved capabilities and needs from a possible collaboration.
3. Read the problem, possible payer, demand caveat, arrangement and risks. See actual documented paths where they exist; co-membership is not a personal introduction.
4. Save and edit the opportunity. Set a follow-up and record what each participant actually agrees to provide.

Demo intelligence is deterministic lexical retrieval + recorded graph paths, not a simulated OpenAI response. It supports arbitrary text questions with matching recorded terms; it is not a general-purpose reasoning model.

## Connected Supabase mode

1. Create a Supabase project. Run `supabase/migrations/001_network.sql` in the SQL Editor of a **fresh** project, or apply it with the Supabase CLI (`supabase db push`). The migration is intentionally not a repeated idempotent script.
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the public anon key). Never put a service-role key or OpenAI key in a `NEXT_PUBLIC_` variable.
3. In Supabase Auth configure the Site URL and redirect allowlist for `http://localhost:3000` and your eventual production HTTPS origin. Enable email/password and email confirmation as appropriate. Configure SMTP before inviting real users.
4. Restart the app. In Profile/Settings create an account, confirm the email if required, then sign in.
5. A connected account starts **empty**. Demo records are never silently uploaded. Signing out returns to browser-local demo data.

Every server route validates the access token through `auth.getUser`. Database calls use the current user's bearer token and the anon key, so PostgreSQL RLS is also enforced. The server sets owner_id itself. Composite foreign keys prevent linking another account's people, organisations, facts, transactions or opportunities. No service-role key is used by this app.

For a separate real-account isolation check: sign into two disposable accounts in separate browser profiles, create records in each, and verify their lists/exports remain separate. This live-provider test was not executed in this build. Automated tests exercise the actual migration against embedded PostgreSQL, including RLS with authenticated/anonymous roles.

### Optional fictional seed for a connected test account

Use a disposable account. Add `SEED_EMAIL` and `SEED_PASSWORD` to `.env.local` and run:

```bash
npm run seed
```

Remove those two variables afterwards. The script signs in normally; it needs no admin key. It upserts deterministic fictional records and is suitable only for an empty dedicated demo account. Alternatively set `app.seed_owner` to the existing account UUID in a SQL Editor session and run `supabase/seed.sql`. `supabase/demo.seed.json` is also a version-1 backup the application can restore through Settings. The auth user must already exist before SQL seeding.

## OpenAI configuration

1. Set server-only `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env.local`. The example model is `gpt-5-mini`; choose a currently accessible Responses API model supporting strict JSON-schema outputs in your own OpenAI account.
2. Restart the server. Sign into connected mode. In Settings enable “Allow AI processing”. Private notes remain excluded unless you separately enable them.
3. Ask a question on Home. The server loads only the authenticated owner's records, retrieves candidate profiles and approved facts, and sends that context to OpenAI. New public facts remain pending until explicitly approved.
4. If no OpenAI key is set, connected mode returns a clearly labelled rules-based answer. API failures show an error; they are not silently presented as a model answer.

Generated prose is labelled **AI hypothesis**. Evidence, source IDs, participants and direct paths are assembled from saved data; unknown model-selected record IDs reject the response. Source content is untrusted data. This reduces but does not eliminate model errors: review any proposed collaboration yourself. No invented monetary value is saved; unknown values and fees remain null. `store:false` is used; provider retention depends on your OpenAI account terms.

The external model integration is implemented but was not called with a real key in this environment. Do not describe it as live-tested. Before broad use, add distributed rate limits, token/spend quotas and stronger model-evaluation coverage.

## Google Contacts OAuth

1. In Google Cloud enable the People API, configure an OAuth consent screen, and create a web OAuth client. Add Supabase's `/auth/v1/callback` URL to the authorised redirect URIs.
2. Configure Google in Supabase Auth using that client ID/secret. For linking an existing non-Google account, enable Supabase manual identity linking if required. For development, register test users in Google's consent screen.
3. In Settings choose “Connect Google with Contacts permission”. The requested additional scope is `https://www.googleapis.com/auth/contacts.readonly`.
4. After returning, open Import → Google Contacts and review/select results before saving.

The Google provider token is kept in session memory; the app's custom Supabase storage adapter strips provider_token and provider_refresh_token from persistent browser storage. After a reload or expiry, reconnect Google. Supabase access/refresh tokens still persist to support app sign-in. No Google refresh token or contact token is stored in the database. Read-only Google access is server-side, using the user's authorised token; no scraping occurs. Pagination is supported up to 10,000 contacts. Google OAuth consent/verification and real People API calls were not tested without credentials.

Device contact import uses the standard Contact Picker API only where available. Safari/iPhone may not expose it; CSV/VCF is the documented fallback. No unsupported iPhone access is claimed.

## Public enrichment, sharing and privacy

- Attach professional links. Use “Review public text” in a profile to paste permitted public information, add source/date, and save it as pending.
- This build does **not** automatically scrape LinkedIn/X, fetch arbitrary URLs or extract public facts with AI. The review workflow works with manually supplied public text. Pending facts never enter retrieval.
- Facts have separate `private`, `public`, and `shareable` visibility. “Public” describes source/access classification; it does not publish anything.
- Export full private backup for your own use; it includes notes and contact details. The sharing export includes only explicitly approved shareable facts with person names and sources.
- Deleting a person removes their facts, transactions, associations and edges and clears opportunity references. Follow-up/opportunity history remains; private names manually copied into free-text notes are not automatically redacted. Review those histories separately when fulfilling erasure requests.
- No emails, notifications to third parties, invitations, commissions or introductions are sent automatically. Reminders appear inside the application only.
- Data deletion is permanent in the connected database; the UI asks for confirmation. Account deletion must be handled in Supabase administration; self-service account deletion is not implemented.
- Demo localStorage and exported JSON are not encrypted. The app has no public person pages. An authenticated deployment needs HTTPS and ordinary production operations/security review.

## Deployment

### Full application: Vercel or another Node.js Next.js host

Import the unzipped source into a private Git repository, connect it to your host, use `npm ci`, build `npm run build`, and deploy the Next.js app. On a Node host run `npm start` after building. Add all necessary environment variables at build/runtime; Supabase's public variables must be present at build time. Set the final HTTPS origin in Supabase Auth redirect settings. Database migrations are separate from application deployment. No platform credentials are included.

### Private hosted demo

This source includes a secondary Vite entry solely for the browser-local demonstration, since the available Sites host does not run a standard Next.js Node server. It imports the same React components, store and intelligence code; server/auth integrations are deliberately disabled in that preview.

```bash
npm run preview:build
```

Output: `dist/index.html`, `dist/mobile.html`, assets and sample import files. Serve `dist` over HTTP/HTTPS; do not open HTML directly from file://. `mobile.html` presents three actual 380px application iframes. These are interactive responsive views, not image mockups.

The full downloadable Next.js project remains the primary deliverable. The hosted demo is not a deployed Supabase/OpenAI service. `.openai/hosting.json` identifies the owner-private demo; do not reuse that project ID for someone else's deployment. Standard Vercel deployment ignores it.

## Project map

- `app/`: Next shell and authenticated server API routes.
- `components/`: interactive navigation, profiles, import wizard, assistant, forms and shared controls.
- `lib/types.ts`, `validation.ts`: typed records and write validation.
- `lib/store.ts`: browser-local demo persistence / authenticated API adapter.
- `lib/intelligence.ts`: lexical retrieval, evidence assembly and bounded graph paths.
- `lib/import.ts`: CSV/VCF parsing, duplicate detection and non-destructive field merge.
- `lib/supabase.ts`, `server.ts`: session handling / server authorisation.
- `supabase/`: migration, fictional SQL/JSON seed data.
- `tests/`: behaviour, migration/RLS and API guard tests.
- `docs/`: feature checklist, testing report and walkthrough.
- `CODEX_HANDOFF.md`: architecture, implementation boundaries and next work.

See the handoff and test report before using real contact data.
