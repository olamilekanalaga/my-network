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

## Optional profiles, social dropdowns, notifications, and five themes

All personal-profile fields, including role, role detail, company, name, and goal, now permit empty values in both demo and authenticated modes. Saving profile edits preserves empty values instead of merging demo defaults back in. Enter demo now still provides the optional fictional starting profile. Blank saved profiles show neutral placeholders; contacts retain their existing name requirement.

Website/social editing is a collapsed section with add/remove rows, a platform dropdown, and a URL input. Platform choices include Website, LinkedIn, X, Instagram, GitHub, Facebook, TikTok, YouTube, and Other. Platform handles can be expanded into URLs; empty rows are discarded on save. Existing saved links remain editable. The notification bell is removed from the top bar and placed beside Ask my network in Home quick actions, with the existing follow-up count and dialog behavior.

Profile now offers Lime, Lilac, Ocean, Sunset, and Midnight themes. Selection updates global surface/text/accent/border tokens across onboarding, Home, Contacts, Ask, Profile, dialogs, and forms. The choice is cached locally for startup and saved with the self-profile, including the existing authenticated metadata path. Local application remains usable if account synchronization fails, with explicit feedback. Theme IDs are validated; no credential or network settings change is required.

Validation: 39 automated tests, TypeScript, and production build passed. Browser checks covered completely empty saved profiles, no automatic refill, social dropdown/platform/handle/empty-row behavior, relocated notifications, five distinct theme palettes, saved selection across reload/editing, all four workspace views, mobile overflow, and browser runtime errors.

Final Midnight visual checks also passed; sampled prompt and answer text measured at least 11.48:1 contrast after replacing remaining hard-coded colors. Empty profile avatars use a neutral user icon, and the cover motif follows the selected theme accent.

## Contact FAQs, company details, Notes, and navigation

Contact needs, offers, building, resources, context, and private notes now use a single-open FAQ accordion. Opening another answer closes the current one; answers start collapsed. Contact editing uses the same pattern for optional details, with concise labels and no context-coaching paragraphs. A contact name remains the identifying field; needs, offers, company data, and other context can be added later. Company views/editors also collapse optional descriptive fields.

Company name and website/social links are grouped together in contact editing, company records, and personal-company setup. Contacts use existing company records and affiliations. Additional company socials use a validated suffix within the existing organization notes field, preserving human notes. No database migration is needed. Changing a contact to a different company creates/relinks that contact's company association rather than renaming a shared organization; clearing the optional company removes only the association. Existing organizations are retained.

Profile is accessed from the top-right profile button. Bottom navigation is Home, Contacts, Ask My network, Notes, Notifications; Notifications is last and retains follow-up counts and completion controls. Home offers Add contact, Import, Ask my network, and Notes.

Notes supports Quick jot, Diary, Memory, and Idea entries with optional title and optional contact link. Users can search/filter, edit, delete, or explicitly use a note in the contact editor for later completion. Notes persist as structured completed private activity records through the existing storage/API. They are excluded from reminders, question history, and AI evidence retrieval. Copying into a contact is an explicit review/save action. Deleting a contact retains the note with its contact link cleared. No new table or migration is required; existing owner policies and contact ownership constraints apply.

Validation: all 44 automated tests and production build passed. PostgreSQL checks cover private-note ownership, cross-owner contact-link rejection, and preserving notes on contact deletion. Browser checks passed for the five-button navigation, top profile access, exclusive FAQ behavior, contact/company/social persistence, linked and unlinked notes create/edit/delete/reload, explicit contact-editor transfer, separation from questions/follow-ups, own-company links, mobile overflow, and runtime errors.

## Theme-wide readability review and contact-only import

Fixed the shared modal header's hard-coded white background, which made titles and close icons disappear in Midnight. Dialog headers, placeholders, badges, tabs/counts, secondary labels, company/relationship/opportunity text, error states, and import surfaces now follow the theme palette. Adjusted secondary palette colours for readable text on the lighter themes. Added matching native control colour schemes, option colours, visible focus outlines, and autofill text/surfaces.

A browser contrast audit covered 18 screen/dialog states in each of the five themes (90 total), including Profile/settings, Home, import/review, contact details/editing, Contacts, company/relationship views, company/opportunity editors, Notes/editing, Notifications, Ask with evidence, and profile editing. No low-contrast enabled text or placeholder findings remained at 4.5:1 for normal text and 3:1 for large text. Disabled controls and image content are outside this text audit; it is not a claim of complete accessibility conformance. Results are recorded in `docs/theme-check-results.json`.

Import now exposes one Import from contacts action. It uses the Contact Picker where available, otherwise a shared/exported `.vcf` contact card. CSV, sample-download, Google Contacts import controls, and the Contacts-permission connection button were removed from the UI. Google sign-in is unchanged. Legacy parsing helpers/API code remain for compatibility but are not offered as import choices.

Imported contacts go through review and duplicate handling, then every imported or already-existing selected contact can open Add details in the same full PersonForm used for manual contacts. Later editing is unchanged. Default duplicate handling preserves existing notes, skills, needs, and company associations. Phone/email-only contacts retain an editable identifier instead of being dropped. Native cancellation makes no changes. File fallback accepts only contact cards, with existing size/count limits; valid card URLs are normalized and unsupported URL schemes are excluded.

Validation: all 47 tests and production build passed. Browser tests used a controlled Contact Picker fixture to check supported-device results, full-editor completion/reload, duplicate preservation, phone-only contacts, and cancellation; actual OS permission prompts require a target-device check. The real file-picker/contact-card path was also exercised, including CSV rejection and subsequent full-editor changes. Midnight import rendering and runtime-error checks passed.

Dialog overlays also sit above temporary save toasts so those messages cannot cover dialog instructions or controls.

## Contact sample avatars

Added 16 bundled portrait illustrations for contacts without a photo. Each contact's stable ID selects its sample avatar, so it stays consistent across reloads and across Home, Contacts, relationship profiles, editing, imports, Ask results, company members, and opportunity participants. Samples are labelled in image alternative text and hover titles. Uploaded or imported actual photos take priority; failed photos fall back to sample art, then initials if the local asset also fails. Personal account avatars are unchanged.

Sample art is a presentation fallback only: it is not written into contact records, exports, notes, matching evidence, or any shared identity profile. The assets are local SVG illustrations without external requests. Member identity linking and mutual-contact visibility remain discussion-only and are not implemented.

Validation: all 47 automated tests and the production build passed. Mobile browser checks passed for all ten seeded contact images loading, stable images after reload, consistent list/detail/editor images, new-contact preview, uploaded-photo priority and persistence, failed-photo fallback without rewriting stored data, unchanged personal avatars, light/dark display, mobile overflow, and runtime errors.
