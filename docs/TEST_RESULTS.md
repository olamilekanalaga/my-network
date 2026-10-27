# Verification report — 27 October 2026

## Passed

- `npm ci` / dependency lockfile produced; no secrets embedded in source or ZIP.
- `npm test`: 17 tests passed, zero failed/skipped in the recorded final run (see test-output.txt).
- `npm run typecheck`: passed.
- `npm run build`: Next production build passed, root page and all four API route families compiled.
- `npm run preview:build`: static demo build passed; generated main/mobile HTML, JS/CSS and sample imports.

Tests cover quoted CSV, common/folded VCF, malformed/oversized imports, duplicate preservation, all seeded record schemas, reciprocal customer retrieval, unsupported questions, pending/private evidence exclusion, graph provenance, coalition candidates, deletion references, invalid financial/pipeline inputs, authenticated API guards, unknown-table denial and request limits.

The PostgreSQL test runs the actual migration with an auth fixture and real authenticated/anon database roles. It verifies owner reads, forged owner writes, rejected cross-owner associations/edges/opportunity links, graph traversal, fee checks, normalised participant links, cascading fact cleanup and anonymous access denial. This is an embedded PostgreSQL/PGlite test, not a live Supabase Auth provider test.

## Not verified / blocked

- Real Supabase signup, email confirmation, JWT refresh and hosted PostgREST: no configured project/key.
- Google OAuth consent, linking, token lifetime and People API: no credentials or consent configuration.
- OpenAI response generation/model quality: no API key. The request/validation path is implemented; no paid call was made.
- Contact Picker support on actual iPhone/Android devices: no device access.
- Complete browser journeys and visual/mobile QA: not completed. Initial managed Next development preview encountered runtime host errors; production compilation passed. Browser automation subsequently rejected navigation under its URL/security policy, so no screenshots are claimed or supplied.
- Real Safari behaviour, keyboard modal focus and screen-reader UX: manual verification remains necessary.
- Full production security/load/retention/backup review: not performed.

## Known limitations

- Retrieval is lexical/heuristic and can overmatch general terms; a saved statement is only as reliable as its input. Generated AI prose remains a hypothesis.
- Full-small-network reads use a bounded record cap; very large networks need server search/pagination. No vector database is configured.
- Imports are sequential and can partially succeed; errors explain retry/dedup behaviour. The merge fills blanks and unions categories/links/skills without overwriting existing notes. Legacy vCard encodings/photo fields are unsupported.
- Demo data and full JSON backups are unencrypted. Demo mode is for fictional exploration. Data in notes manually copied to an opportunity is not automatically redacted when a person is deleted.
- No distributed rate limiter/token quota; do not broadly expose the connected AI service before adding one.
- Browser-local demo uses persistence on the current origin; moving between localhost and hosted preview does not migrate edits automatically. Use backup export/restore if needed.
- Static preview build may report bundle-size optimisation warnings. They do not fail the build. Source remains modular; split larger dialogs before scaling the UI.

No automated test failures remain in the final recorded output. Integration/visual checks above remain explicitly unverified rather than reported as passes.
