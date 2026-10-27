import { z } from "zod";
export const entryModeKey = "network-entry-mode";
export const demoProfileKey = "network-self-profile-demo-v1";
export const selfProfileSchema = z.object({
  name: z.string().trim().min(1, "Add your name.").max(100),
  role: z.enum([
    "Business developer",
    "Business owner",
    "Recruiter",
    "Job seeker",
  ]),
  headline: z.string().trim().max(150),
  location: z.string().trim().max(120),
  offers: z.string().trim().max(2000),
  needs: z.string().trim().max(2000),
  goal: z.string().trim().min(1, "Tell us what you want to achieve.").max(1000),
});
export type SelfProfile = z.infer<typeof selfProfileSchema>;
export const blankSelfProfile = (): SelfProfile => ({
  name: "",
  role: "Business developer",
  headline: "",
  location: "",
  offers: "",
  needs: "",
  goal: "",
});
export function readSelfProfile(value: unknown): SelfProfile | null {
  const parsed = selfProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
