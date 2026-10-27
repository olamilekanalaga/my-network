import type { Person, Data } from "./types";

export function missingContext(p: Person): string[] {
  return [
    !p.position && !p.industry ? "What they do" : "",
    !p.services && !p.offers && !p.skills.some(Boolean)
      ? "What they can provide"
      : "",
    !p.needs ? "What they need" : "",
    !p.met ? "How you know them" : "",
  ].filter(Boolean);
}
export type ActionKind =
  | "Contact"
  | "Request introduction"
  | "Reconnect"
  | "Collaborate"
  | "Discuss purchase";
export const actionKinds: ActionKind[] = [
  "Contact",
  "Request introduction",
  "Reconnect",
  "Collaborate",
  "Discuss purchase",
];
export function messageDraft(
  person: Person,
  goal: string,
  kind: ActionKind,
): string {
  const opening = `Hi ${person.name.split(" ")[0]},`;
  const objective = goal.trim() || "explore a possible opportunity";
  const requests: Record<ActionKind, string> = {
    Contact: `My goal: ${objective}. Is this something you could help with, or would you be open to a quick chat?`,
    "Request introduction": `My goal: ${objective}. Do you know someone suitable, and would you be comfortable asking whether they’d welcome an introduction? Please check with them before sharing contact details.`,
    Reconnect: `It’s been a while${person.met ? ` since we connected (${person.met})` : ""}. I’d love to hear what you’re working on. My goal: ${objective}. Would you be up for catching up?`,
    Collaborate: `My goal: ${objective}. Would you be open to exploring a collaboration? We can discuss our goals, availability, responsibilities, and terms before committing.`,
    "Discuss purchase": `My goal: ${objective}. Could you confirm whether you offer this and share your availability, scope, and a quote? This is an enquiry, not an order.`,
  };
  return `${opening}\n\n${requests[kind]}\n\nThanks!`;
}
export function contactLinks(person: Person, message: string, subject: string) {
  const phone = person.phone.trim();
  const validPhone = /^\+?[\d\s().-]{5,30}$/.test(phone);
  const email = person.email.trim();
  return {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
      : null,
    phone: validPhone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null,
    sms: validPhone
      ? `sms:${phone.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(message)}`
      : null,
  };
}

export function introductionContacts(target: Person, data: Data): Person[] {
  const ids = new Set(
    data.relationships
      .filter(
        (r) =>
          r.verification === "Confirmed" &&
          (r.from_id === target.id || r.to_id === target.id),
      )
      .map((r) => (r.from_id === target.id ? r.to_id : r.from_id)),
  );
  return data.people.filter((p) => p.id !== target.id && ids.has(p.id));
}
export function introductionDraft(
  recipient: Person,
  target: Person,
  goal: string,
): string {
  return `Hi ${recipient.name.split(" ")[0]},\n\nMy goal: ${goal.trim() || "explore a possible opportunity"}. I have a saved relationship between you and ${target.name}. Would you be comfortable checking whether they’d welcome an introduction? Please check with them before sharing contact details, and only proceed if you’re both comfortable.\n\nThanks!`;
}
