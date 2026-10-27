import { z } from "zod";
import { themeIds } from "./themes";
import { photoSchema, profileLinksSchema } from "./profile-media";
export const entryModeKey = "network-entry-mode";
export const demoProfileKey = "network-self-profile-demo-v1";
export const profileRoles = [
  "Business owner",
  "Skilled worker / Talent",
  "Founder",
  "Agency",
  "Recruiter",
  "Other",
] as const;
export const roleFields = {
  "Business owner": {
    label: "What does your business do?",
    placeholder: "A clothing brand, a neighbourhood café, IT services…",
  },
  "Skilled worker / Talent": {
    label: "What’s your skill or talent?",
    placeholder:
      "Data analyst, content creator, business developer, electrician…",
  },
  Founder: {
    label: "What are you building?",
    placeholder: "Tell us about your company and the problem you solve",
  },
  Agency: {
    label: "What kind of agency do you run?",
    placeholder: "Recruitment, marketing, creative, talent management…",
  },
  Recruiter: {
    label: "What kinds of roles do you recruit for?",
    placeholder: "Tech talent, healthcare professionals, creative roles…",
  },
  Other: {
    label: "Tell us what you do",
    placeholder: "In your own words—there’s room for everyone here",
  },
} as const;
export const roleStepSchema = z.object({
  role: z.enum(["", ...profileRoles]),
  roleDescription: z.string().trim().max(2000).default(""),
  companyName: z.string().trim().max(150).default(""),
});
export const selfProfileSchema = z.object({
  name: z.string().trim().max(100),
  displayName: z.string().trim().max(100).default(""),
  workCompany: z.string().trim().max(150).default(""),
  role: z.enum(["", ...profileRoles]),
  roleDescription: z.string().trim().max(2000).default(""),
  companyName: z.string().trim().max(150).default(""),
  theme: z.enum(themeIds).default("lime"),
  photo: photoSchema.default(""),
  links: profileLinksSchema.max(10).default([]),
  headline: z.string().trim().max(150),
  location: z.string().trim().max(120),
  offers: z.string().trim().max(2000),
  needs: z.string().trim().max(2000),
  goal: z.string().trim().max(1000),
});
export type SelfProfile = z.infer<typeof selfProfileSchema>;
export const blankSelfProfile = (): SelfProfile => ({
  name: "",
  displayName: "",
  workCompany: "",
  role: "",
  theme: "lime",
  roleDescription: "",
  companyName: "",
  photo: "",
  links: [],
  headline: "",
  location: "",
  offers: "",
  needs: "",
  goal: "",
});
export function readSelfProfile(value: unknown): SelfProfile | null {
  const parsed = selfProfileSchema.safeParse(migrateProfileRole(value));
  return parsed.success ? parsed.data : null;
}

export const roleDraftSchema = z.object({
  role: z.enum(["", ...profileRoles]),
  roleDescription: z.string().max(2000),
  companyName: z.string().max(150).default(""),
});
export function mergeDemoProfile(input: SelfProfile): SelfProfile {
  const defaultDetails: Record<SelfProfile["role"], string> = {
    "": "Creative projects and community building",
    "Business owner": "I run a small creative business.",
    Founder: "I’m building tools that help small businesses grow.",
    Agency: "Marketing and content creation",
    "Skilled worker / Talent": "Data analysis and content creation",
    Recruiter: "Recruiting design and technology talent",
    Other: "Creative projects and community building",
  };
  const defaults: SelfProfile = {
    name: "Alex Morgan",
    theme: input.theme,
    displayName: "⭕️La_Crrypt💰₿",
    workCompany: input.companyName.trim() || "Studio North",
    role: input.role,
    roleDescription: defaultDetails[input.role],
    companyName: ["Founder", "Business owner", "Agency"].includes(input.role)
      ? "Studio North"
      : "",
    photo: "/demo-profile.svg",
    links: [],
    headline:
      input.role === "Founder" || input.role === "Business owner"
        ? "Founder & community builder"
        : input.role === "Agency"
          ? "Agency director"
          : input.role === "Recruiter"
            ? "Talent partner"
            : input.role === "Skilled worker / Talent"
              ? "Independent creative"
              : "Community builder",
    location: "London",
    offers: input.roleDescription.trim() || defaultDetails[input.role],
    needs: "Collaborators and new connections",
    goal: "Find collaborators for my next project",
  };
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof SelfProfile)[])
    if (key === "theme") merged.theme = input.theme;
    else if (key === "links") merged.links = input.links;
    else if (key !== "role" && input[key].trim())
      merged[key] = input[key].trim();
  return selfProfileSchema.parse(merged);
}

export function migrateProfileRole(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const saved = value as Record<string, unknown>;
  if (saved.role !== "Business developer" && saved.role !== "Job seeker")
    return value;
  return {
    ...saved,
    role: "Skilled worker / Talent",
    roleDescription:
      typeof saved.roleDescription === "string" && saved.roleDescription.trim()
        ? saved.roleDescription
        : saved.role === "Business developer"
          ? "Business development"
          : typeof saved.headline === "string" && saved.headline.trim()
            ? saved.headline
            : "Exploring my next opportunity",
  };
}

export function demoProfileForDisplay(profile: SelfProfile): SelfProfile {
  const sample = profile.name === "Alex Morgan";
  return {
    ...profile,
    displayName:
      profile.displayName || (sample ? "⭕️La_Crrypt💰₿" : profile.name),
    photo: profile.photo || (sample ? "/demo-profile.svg" : ""),
    workCompany:
      profile.workCompany ||
      (sample && !profile.companyName ? "Studio North" : ""),
    headline: profile.headline || (sample ? "Community builder" : ""),
  };
}
