export const goals = {
  "Business developer": {
    title: "Your next deal starts with a hello.",
    detail:
      "Find partners, build warm introductions, and keep your pipeline moving.",
    action: "Explore my pipeline",
    tab: "Opportunities",
    prompts: [
      "Who in my network needs marketing services?",
      "Who can help a fintech expand into the UK?",
      "Which customers also provide services I need?",
    ],
  },
  "Business owner": {
    title: "Big plans. Meet your people.",
    detail:
      "Find trusted suppliers, connect with collaborators, and grow your business.",
    action: "Find my people",
    tab: "People",
    prompts: [
      "Who can print 5,000 event materials in London?",
      "Who provides marketing services?",
      "Which customers also provide services I need?",
    ],
  },
  Recruiter: {
    title: "Good talent. Real connections.",
    detail:
      "Explore skills, remember the context, and keep candidate conversations moving.",
    action: "Explore my contacts",
    tab: "People",
    prompts: [
      "Who has software development skills?",
      "Who has experience in marketing?",
      "Who in my network works in fintech?",
    ],
  },
  "Job seeker": {
    title: "Your next chapter starts here.",
    detail:
      "Discover people in your field, find warm connections, and follow up with confidence.",
    action: "Explore my network",
    tab: "Network",
    prompts: [
      "Who in my network works in technology?",
      "Who has connections in marketing?",
      "Who can help with business introductions?",
    ],
  },
} as const;
export type Goal = keyof typeof goals;
