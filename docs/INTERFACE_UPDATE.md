# People-first interface update

The main Next.js application now uses a cream, lime, ink, and lavender palette with stronger typography, clear borders, and responsive goal shortcuts.

Choose Business developer, Business owner, Recruiter, or Job seeker on Home. The choice persists locally and changes the welcome message, suggested network searches, and primary shortcut. These are personal workspace preferences, not account permissions or a public job board. Searches use existing saved records; no role creates fictional vacancies or candidates.

Existing contacts, import, opportunity tracking, follow-ups, privacy controls, and optional integrations remain available.

## Deploy on Vercel

Import `olamilekanalaga/My-Network` from GitHub, select branch `main`, keep the root directory as the repository root, and deploy with the Next.js preset. `vercel.json` specifies the install and build commands.

The demo works without environment variables and saves fictional records in the browser. For authenticated live storage, configure the Supabase variables listed in `.env.example`, apply `supabase/migrations/001_network.sql`, and configure the deployed URL in Supabase Auth. Optional AI and Google Contacts integrations require their documented credentials and provider configuration. Never commit credential values.

Validation for this update: TypeScript check, production build, and all 17 existing tests passed. See the task report for browser and deployment results.

## Contacts → context → matching → action

Home now shows incomplete profiles and links directly to editing the missing role, capability, need, and relationship context. The contact editor explains what each profile needs. Device Contact Picker (on supported browsers), CSV/VCF imports, and the existing Google Contacts adapter remain available; address-book background sync is not implemented.

Matching now recognizes common developer/design/recruiting terminology, weights provider capabilities above buyer needs for service searches, and excludes location-only matches. Profile roles are included in cited evidence. A saved contact with no recorded meeting context no longer gets an implied direct relationship path. This remains a bounded record-matching engine, not exhaustive semantic search.

Matching works without AI consent in both demo and authenticated workspaces. Optional live OpenAI processing still requires explicit consent, Supabase authentication, and server credentials. Pending facts and private-note exclusion remain enforced.

Contact profiles and match cards open an editable action draft for contact, reconnection, collaboration, introduction requests, or purchase enquiries. Email, SMS, and call links use saved contact details. Introduction requests can be addressed to an intermediary with a confirmed saved relationship to the target; the user verifies permission before sending. Drafts are never automatically sent. Follow-up dates and drafts persist through the existing activity store and appear on Home. No payment or ordering integration is implied.

Live deployment prerequisites remain external: configure Supabase project/Auth and the database migration for authenticated cross-device storage; configure Google OAuth for Google Contacts; configure an OpenAI server key for live AI; and authenticate Vercel to deploy to the user's account. Browser-local demo storage is not a substitute for a production account.

Validation of the journey update: all 22 automated tests passed, TypeScript and production build passed, and a browser journey verified profile creation, capability matching, introduction draft generation, correct email recipient, persistent follow-ups, and no mobile horizontal overflow or browser runtime errors. Live provider integrations and Vercel deployment were not verified because their credentials are absent from this environment.

## Dedicated entry and self-profile flow

The Next.js app now opens with Google sign-in or a demo choice at `/`. `/onboarding` is a dedicated page that preserves the cream/lime hero and audience selector, followed by the user's own profile form. `/workspace` contains contacts, matching, pipeline, and follow-ups; the audience selector lives on onboarding rather than the dashboard. Returning users with a complete profile go to their workspace. Profile editing returns to onboarding, and sign-out/leave-demo is available on desktop and mobile.

Demo selection and self-profile are stored separately from imported contacts. Demo edits do not upload to an authenticated account. Google login uses Supabase OAuth without requesting Contacts permission on initial sign-in. Signed-in self-profile data is saved under the current user's `network_profile` authentication metadata; authorization continues to use verified server identities and database RLS, never this profile's audience field. Names and goals are required, other fields are optional. The selected audience and saved goal personalize the dashboard and search suggestions. Existing contact records are preserved.

For production Google sign-in, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel and redeploy. Enable the Google provider in Supabase, register Supabase's displayed callback URL in Google OAuth, set the site URL to `https://my-network-theta.vercel.app`, and allow `https://my-network-theta.vercel.app/onboarding` as a Supabase redirect URL (plus approved preview/development URLs if needed). Keep Google provider secrets in Supabase. Do not put secrets in source or chat. Apply the existing database migration for the authenticated workspace. The demo remains available without provider configuration.

Validation: TypeScript, the production build, and 24 automated tests passed. The live Google provider is not credential-tested in this environment. Deployment status cannot be verified from this environment while access to the production domain and GitHub status API is blocked. A push to `main` triggers deployment only if the Vercel project is connected to this repository and branch with automatic deployments enabled.

Browser validation also passed for first-visit route protection, the Google-unavailable error with demo fallback, demo self-profile creation, profile/contact separation, workspace personalization, reload persistence, profile editing, mobile leave-demo, returning-user redirects, and mobile overflow/runtime errors.
