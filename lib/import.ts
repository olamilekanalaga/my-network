import Papa from "papaparse";
import { blankPerson, type Person, type Data } from "./types";
const norm = (s: string) => s.trim().toLowerCase();
export function parseContacts(text: string, filename: string): Person[] {
  if (text.length > 5_000_000) throw new Error("Maximum file size is 5 MB.");
  if (filename.toLowerCase().endsWith(".vcf")) return parseVcf(text);
  if (!filename.toLowerCase().endsWith(".csv"))
    throw new Error("Choose a CSV or VCF file.");
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => norm(h).replace(/[ _-]/g, ""),
  });
  if (result.errors.length)
    throw new Error(`CSV could not be read: ${result.errors[0].message}`);
  if (result.data.length > 2000)
    throw new Error("Import up to 2,000 contacts at a time.");
  return result.data
    .map((row) => ({
      ...blankPerson(),
      name:
        row.name ||
        row.fullname ||
        [row.firstname, row.lastname].filter(Boolean).join(" "),
      email: row.email || row.emailaddress || row.email1value || "",
      phone: row.phone || row.telephone || row.phone1value || "",
      position: row.position || row.title || "",
      location: row.location || "",
      services: row.services || "",
      source: `Imported CSV: ${filename}`,
      verification: "Inferred" as const,
    }))
    .filter((p) => p.name.trim());
}
function parseVcf(text: string): Person[] {
  const cards = text
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split(/BEGIN:VCARD/i)
    .slice(1);
  if (cards.length > 2000)
    throw new Error("Import up to 2,000 contacts at a time.");
  const unescape = (s: string) =>
    s.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
  return cards
    .map((card) => {
      const p = blankPerson();
      for (const line of card.split("\n")) {
        const colon = line.indexOf(":");
        if (colon < 0) continue;
        const key = line
          .slice(0, colon)
          .split(";")[0]
          .replace(/^item\d+\./, "")
          .toUpperCase();
        const value = unescape(line.slice(colon + 1).trim());
        if (key === "FN") p.name = value;
        if (key === "N" && !p.name)
          p.name = value.split(";").slice(0, 2).reverse().join(" ").trim();
        if (key === "EMAIL" && !p.email) p.email = value;
        if (key === "TEL" && !p.phone) p.phone = value;
        if (key === "TITLE") p.position = value;
        if (key === "URL") p.links.push(value);
      }
      p.name = p.name.trim() || p.email || p.phone;
      p.source = "Imported VCF";
      p.verification = "Inferred";
      return p;
    })
    .filter((p) => p.name);
}
export function duplicateOf(p: Person, people: Person[]): Person | undefined {
  return people.find(
    (x) =>
      x.id !== p.id &&
      ((p.email && norm(p.email) === norm(x.email)) ||
        (p.phone &&
          p.phone.replace(/\D/g, "") === x.phone.replace(/\D/g, "")) ||
        norm(p.name) === norm(x.name)),
  );
}
export function mergePeople(existing: Person, incoming: Person): Person {
  const out = { ...existing };
  for (const k of Object.keys(incoming) as (keyof Person)[]) {
    if (["id", "updated_at", "verification", "strength", "source"].includes(k))
      continue;
    const val = incoming[k];
    if (Array.isArray(val))
      (out as unknown as Record<string, unknown>)[k] = [
        ...new Set([...(existing[k] as string[]), ...val]),
      ];
    else if (!existing[k] && val)
      (out as unknown as Record<string, unknown>)[k] = val;
  }
  return { ...out, updated_at: new Date().toISOString() };
}
export function deletePerson(data: Data, id: string): Data {
  return {
    ...data,
    people: data.people.filter((p) => p.id !== id),
    affiliations: data.affiliations.filter((a) => a.person_id !== id),
    relationships: data.relationships.filter(
      (r) => r.from_id !== id && r.to_id !== id,
    ),
    facts: data.facts.filter((f) => f.person_id !== id),
    transactions: data.transactions.filter((t) => t.person_id !== id),
    opportunities: data.opportunities.map((o) => ({
      ...o,
      person_ids: o.person_ids.filter((x) => x !== id),
    })),
    activities: data.activities.map((a) => ({
      ...a,
      person_id: a.person_id === id ? null : a.person_id,
    })),
  };
}
