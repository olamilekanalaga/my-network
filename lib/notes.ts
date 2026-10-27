import { z } from "zod";
import { type Activity, uid } from "./types";
const prefix = "Private note · ";
export const noteKinds = ["Quick jot", "Diary", "Memory", "Idea"] as const;
const payload = z.object({
  title: z.string().trim().max(150),
  body: z.string().trim().min(1, "Write a note first.").max(8000),
  kind: z.enum(noteKinds),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Note = z.infer<typeof payload> & {
  id: string;
  contactId: string | null;
};
export function blankNote(contactId: string | null = null): Note {
  const date = new Date().toISOString();
  return {
    id: uid(),
    title: "",
    body: "",
    kind: "Quick jot",
    contactId,
    createdAt: date,
    updatedAt: date,
  };
}
export function noteActivity(note: Note): Activity {
  const parsed = payload.parse({
    ...note,
    updatedAt: new Date().toISOString(),
  });
  return {
    id: note.id,
    person_id: note.contactId,
    opportunity_id: null,
    done: true,
    date: parsed.updatedAt.slice(0, 10),
    text: prefix + JSON.stringify(parsed),
  };
}
export function readNote(activity: Activity): Note | null {
  if (
    !activity.done ||
    activity.opportunity_id ||
    !activity.text.startsWith(prefix)
  )
    return null;
  try {
    const parsed = payload.safeParse(
      JSON.parse(activity.text.slice(prefix.length)),
    );
    return parsed.success
      ? { ...parsed.data, id: activity.id, contactId: activity.person_id }
      : null;
  } catch {
    return null;
  }
}
export function allNotes(activities: Activity[]): Note[] {
  return activities
    .map(readNote)
    .filter((n): n is Note => Boolean(n))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
