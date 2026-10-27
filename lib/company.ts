import { normalizeLinks, profileLinksSchema } from "./profile-media";
import { uid, type Organization, type Data } from "./types";
const marker = "\n\nCompany socials · ";
export function companyNotes(value: string): {
  notes: string;
  links: string[];
} {
  const index = value.lastIndexOf(marker);
  if (index < 0) return { notes: value, links: [] };
  try {
    const parsed = profileLinksSchema.safeParse(
      JSON.parse(value.slice(index + marker.length)),
    );
    if (parsed.success)
      return { notes: value.slice(0, index), links: parsed.data };
  } catch {}
  return { notes: value, links: [] };
}
export function saveCompanyNotes(notes: string, links: string[]): string {
  const clean = companyNotes(notes).notes;
  const urls = profileLinksSchema.parse(normalizeLinks(links));
  return clean + (urls.length ? marker + JSON.stringify(urls) : "");
}
export function companyLinks(company: Organization): string[] {
  return [
    ...new Set(
      [company.website, ...companyNotes(company.notes).links].filter(Boolean),
    ),
  ];
}
export function linkedCompany(personId: string, data: Data) {
  const affiliation = data.affiliations.find(
    (a) =>
      a.person_id === personId &&
      data.organizations.some(
        (o) => o.id === a.organization_id && o.kind === "Company",
      ),
  );
  return affiliation
    ? {
        affiliation,
        company: data.organizations.find(
          (o) => o.id === affiliation.organization_id,
        )!,
      }
    : null;
}
export type CompanyDraft = { id?: string; name: string; links: string[] };

export function companyForDraft(
  draft: CompanyDraft,
  previous?: Organization,
): Organization {
  const name = draft.name.trim() || "Company (name not added)";
  const base =
    previous?.name.trim().toLowerCase() === name.toLowerCase()
      ? previous
      : undefined;
  const links = profileLinksSchema.parse(normalizeLinks(draft.links));
  return {
    id: base?.id || uid(),
    kind: "Company",
    name,
    industry: base?.industry || "",
    location: base?.location || "",
    description: base?.description || "",
    capabilities: base?.capabilities || "",
    needs: base?.needs || "",
    website: links[0] || "",
    event_date: base?.event_date || "",
    notes: saveCompanyNotes(base?.notes || "", links),
  };
}
