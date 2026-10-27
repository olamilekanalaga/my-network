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

## Wallet-style Home and four-tab navigation

Primary navigation is now Home, Contacts, Ask My network, and Profile. Home uses a wallet-style contact total, quick Add/Import/Ask actions, and a contacts/question-history ledger. Contacts retains Network and Opportunities as secondary tools. Profile contains the user's own profile, editing, and privacy/account controls. Follow-ups open from the network card or notification button.

Founder counts require the saved Founder category. Skilled-worker counts use a nonempty recorded skill or an explicit Skilled worker category, now available in the contact editor. Needs context counts profiles missing role, capabilities, needs, or how the user knows them. Categories can overlap, so their counts are not additive. No monetary network valuation is shown.

Successful questions are recorded as completed, unlinked activity entries with a validated versioned payload: question, timestamp, summary, and historical match count. This reuses the existing owner-scoped activity API/RLS and requires no database migration. Demo history is local; authenticated history uses the connected account's existing storage. Normal reminders and malformed entries do not appear as questions. Tapping a question pre-fills Ask My network so the user can ask again against current records; historical match counts are not presented as current results. Answers remain available if history persistence fails, with an explicit error message. Existing contact records and onboarding remain intact.

Validation: all 27 automated tests and the production build passed. Browser checks covered the four tabs, contact counts/filtering, import, adding a labeled skilled worker, asking a question, persistent history, asking again after reload, profile, follow-ups, mobile overflow, and browser runtime errors.

## Role dropdown, separate profile step, and optional demo setup

`/onboarding` now contains a dropdown for Business owner, Skilled worker / Talent, Founder, Agency, Business developer, Recruiter, Job seeker, and Other. Each selection asks for a handwritten description suited to that role. Founders and business owners get a company/business name field; agencies get an agency-type description and optional agency name; talent enters their specific skill. No profession or agency type is inferred. `/onboarding/profile` is the next, separate page for name, location, offers, needs, and goals. Back/next navigation keeps the draft in account-scoped session storage, and final saving uses the existing demo/authenticated profile paths. Older saved profiles remain readable.

Demo setup is optional. Enter demo now opens the workspace from the role step. Both role and personal-profile fields may be blank in demo; completion merges entered values with fictional defaults. Entered values win, including company, skill/description, name, and goal. Fully blank setup uses Alex Morgan and a fictional profile. Demo fills only self-profile defaults and does not replace contacts or other workspace data. Authenticated setup retains required name, goal, handwritten role detail, and company name for founder/business-owner roles.

Added tactile shadows, card entrance transitions, hover lift on pointer devices, button press feedback, and role-field transitions across onboarding, wallet Home, contacts, assistant, profile, and dialogs. Reduced-motion preferences disable the movement. These are product interactions; no analytical reports or charts were added.

Validation: all 30 tests, TypeScript, and the production build passed. Browser checks passed for dropdown/conditional fields, separate pages, no-input demo entry, completing both demo steps empty, partial-input precedence, draft back/reload persistence, displayed company details, reduced-motion behavior, and mobile overflow/runtime errors.

## Simpler roles, optional photos, and professional links

Removed Job seeker and Business developer from the main onboarding choices. Skilled worker / Talent now includes business developer in its free-text examples. Existing saved profiles and temporary drafts with either retired role are migrated to Skilled worker / Talent while preserving typed descriptions and other details.

Removed category pills from wallet contact rows and Contacts cards. Categories remain editable and continue to power counts and filters; profile details still show saved categorization.

Contact editing and personal profile setup now offer an optional JPG/PNG/WebP photo picker, preview, and removal. Images are center-cropped and compressed locally into small JPEG thumbnails capped at 18,000 characters, compatible with existing record limits. The thumbnail is saved with the contact or self-profile using existing storage; no new bucket, public image service, or external upload credentials are needed. Avatars use the saved photo in Home, Contacts, profiles, and match results, with initials if the photo is absent or fails to load. Original files and their metadata are not retained.

Both contact and self-profile editors have optional website/social links. Bare domains are normalized to HTTPS; only HTTP/HTTPS links are accepted. Links are displayed in the private profile as external links, not posts, feeds, followers, or public social profiles. Self-profile photos and links survive onboarding back/next navigation and use existing account metadata or browser-local demo storage. Profile images and links are not added to AI evidence retrieval.

Validation: 34 automated tests and the production build passed. Added coverage for image bounds/protocols, link normalization/protocols, removed-role migration, and retaining optional media in demo profiles.

Browser validation passed for simplified dropdown choices, business-development talent examples, self-profile and contact photo upload/preview/persistence/removal, onboarding back/next preservation, normalized optional links, removed list pills, mobile overflow, and browser runtime errors. Shared field labels now explicitly name their controls so prefilled textarea contents do not become part of the accessible label.

## Personal identity card

Profile now centers on a visual identity card with a decorative cover, large avatar, editable display name, company, position/role, and optional social buttons. The former goal/offer/need paragraphs and contact-context coaching are removed from this view. Account, privacy, imports/backups, and deletion controls remain in a collapsed Settings & privacy section. Edit opens `/onboarding/profile` directly; the existing back button still returns to role selection if needed.

Added optional `displayName` and `workCompany` fields to the existing self-profile format, with backward-compatible defaults and the same browser-local or authenticated account-metadata persistence. The personal form includes display name, company, position/role, photo selection, and links. Saved company/role values appear as icon tiles. Social links are rendered as named platform/website buttons; none are fabricated for the user.

A bundled fictional SVG avatar and the display name `⭕️La_Crrypt💰₿` provide the default demo identity. Existing untouched Alex Morgan demo profiles get that presentation; custom names, display names, uploaded photos, employers, and roles are preserved. The avatar validator permits this single bundled SVG path while continuing to reject user-supplied SVG data URLs and arbitrary local paths.

Validation: production build and TypeScript passed. Browser checks passed for default demo portrait/name, card layout without prior report copy/coaching, collapsed settings, direct editing, saved display name/company/role/social buttons, reload persistence, mobile overflow, and browser runtime errors.
