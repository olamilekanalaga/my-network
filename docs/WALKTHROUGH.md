# Review guide

1. Run the app and use the three journeys in README.md.
2. Explore People → Customers. Maya purchased a fictional research brief and also supplies printing. This is the reciprocal-business case.
3. Open Maya, change her categories/needs, add a public fact for review and approve it separately. Set its sharing visibility. New facts never auto-confirm.
4. Open Network → Relationships. Choose Sophie → Ethan for a real saved path; Maya → Daniel has no documented edge even though they attended the same event.
5. Link any person to multiple organisations or events using their profile's Associate action.
6. Create an opportunity with multiple participants and companies. Keep unknown financial values blank. Move through stages and schedule a follow-up.
7. In Settings export a full backup, then a sharing export. Only explicitly approved shareable facts appear in the latter.
8. Review `docs/FEATURE_CHECKLIST.md` before interpreting any provider-dependent feature as verified.

For a visual mobile preview after `npm run preview:build`, serve the dist directory through a static host and open `/mobile.html`. It contains three live application frames, each 380 pixels wide. Use the tabs and forms inside the frames; it is the working demo interface rather than a rendered mockup.

The private hosted preview, when available, is demo-only and owner-restricted. The downloadable Next.js app includes the server routes and Supabase schema for your own connected deployment.
