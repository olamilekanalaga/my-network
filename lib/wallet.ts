import { z } from "zod";
import { missingContext } from "./network-actions";
import { type Person, type Activity, uid } from "./types";
import type { Answer } from "./intelligence";
export type ContactLayer =
  "All contacts" | "Founders" | "Skilled workers" | "Needs context";
export function inContactLayer(person: Person, layer: ContactLayer): boolean {
  if (layer === "Founders") return person.categories.includes("Founder");
  if (layer === "Skilled workers")
    return (
      person.categories.includes("Skilled worker") ||
      person.skills.some((s) => Boolean(s.trim()))
    );
  if (layer === "Needs context") return missingContext(person).length > 0;
  return true;
}
export function contactCounts(people: Person[]) {
  return {
    total: people.length,
    founders: people.filter((p) => inContactLayer(p, "Founders")).length,
    skilled: people.filter((p) => inContactLayer(p, "Skilled workers")).length,
    incomplete: people.filter((p) => inContactLayer(p, "Needs context")).length,
  };
}
const prefix = "Asked my network · ";
const questionSchema = z.object({
  question: z.string().min(1).max(2000),
  summary: z.string().max(8000),
  matches: z.number().int().nonnegative(),
  askedAt: z.string().datetime(),
});
export type QuestionHistory = z.infer<typeof questionSchema> & { id: string };
export function questionActivity(question: string, answer: Answer): Activity {
  const askedAt = new Date().toISOString();
  return {
    id: uid(),
    person_id: null,
    opportunity_id: null,
    done: true,
    date: askedAt.slice(0, 10),
    text:
      prefix +
      JSON.stringify({
        question: question.trim().slice(0, 2000),
        summary: answer.summary.slice(0, 4000),
        matches: answer.recommendations.length,
        askedAt,
      }),
  };
}
export function questionHistory(activities: Activity[]): QuestionHistory[] {
  return activities
    .flatMap((a) => {
      if (
        !a.done ||
        a.person_id ||
        a.opportunity_id ||
        !a.text.startsWith(prefix)
      )
        return [];
      try {
        const parsed = questionSchema.safeParse(
          JSON.parse(a.text.slice(prefix.length)),
        );
        return parsed.success ? [{ ...parsed.data, id: a.id }] : [];
      } catch {
        return [];
      }
    })
    .sort((a, b) => b.askedAt.localeCompare(a.askedAt));
}
