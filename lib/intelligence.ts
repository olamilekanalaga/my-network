import type { Data, Person, Status } from "./types";
export interface Evidence {
  id: string;
  text: string;
  status: Status;
  source: string;
  date: string;
}
export interface Recommendation {
  personId: string;
  name: string;
  why: string;
  evidence: Evidence[];
  path: string[];
  hypothesis: string;
  verify: string;
  nextStep: string;
  wants: string;
  contributes: string;
}
export interface Answer {
  mode: "demo" | "openai" | "rules";
  summary: string;
  recommendations: Recommendation[];
  economics: {
    problem: string;
    payer: string;
    demand: string;
    arrangement: string;
    risks: string;
  };
}
const stop = new Set(
  "who what which can could would should my me the a an in of to and or is are for with how do i need needs help someone anyone people network please find existing also provide".split(
    " ",
  ),
);
export function terms(s: string) {
  return s
    .toLowerCase()
    .replace(/printing|printed|printers?/g, "print")
    .replace(/organisers?|organizers?/g, "event")
    .replace(/introduction|introduce|introductions/g, "intro")
    .replace(/conferences?/g, "event")
    .replace(/technology/g, "tech")
    .replace(/recruiters?|recruitment|hiring/g, "recruit")
    .replace(
      /developers?|development|programmers?|programming|coding/g,
      "software",
    )
    .replace(/designers?|designing/g, "design")
    .replace(/suppliers?|providers?/g, "supplier")
    .replace(/nigerian/g, "nigeria")
    .replace(/founders?/g, "founder")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2 && !stop.has(t));
}
export function graphPath(data: Data, from: string, to: string): string[] {
  const queue = [[from]],
    seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const node = path.at(-1)!;
    if (node === to) return path;
    if (path.length >= 5) continue;
    for (const edge of data.relationships.filter(
      (r) => r.verification === "Confirmed",
    )) {
      const next =
        edge.from_id === node
          ? edge.to_id
          : edge.to_id === node
            ? edge.from_id
            : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return [];
}
export function evidenceFor(
  p: Person,
  data: Data,
  privateNotes = true,
): Evidence[] {
  const entries: [string, string][] = [
    ["role", [p.position, p.industry].filter(Boolean).join(" · ")],
    ["services", p.services],
    ["offers", p.offers],
    ["needs", p.needs],
    ["skills", p.skills.join(", ")],
    ["building", p.building],
    ["resources", p.resources],
    ...(privateNotes
      ? ([
          ["notes", p.notes],
          ["transcript", p.transcript],
          ["promises", p.promises],
        ] as [string, string][])
      : []),
  ];
  return [
    ...entries
      .filter(([, v]) => v)
      .map(([k, v]) => ({
        id: `${p.id}:${k}`,
        text: v,
        status: p.verification,
        source: p.source,
        date: p.updated_at,
      })),
    ...data.facts
      .filter(
        (f) =>
          f.person_id === p.id &&
          f.status === "approved" &&
          (privateNotes || f.visibility !== "private"),
      )
      .map((f) => ({
        id: f.id,
        text: f.text,
        status: f.verification,
        source: f.source_url || "Saved user statement",
        date: f.observed_at,
      })),
    ...data.affiliations
      .filter((a) => a.person_id === p.id)
      .flatMap((a) => {
        const org = data.organizations.find((o) => o.id === a.organization_id);
        return org
          ? [
              {
                id: a.id,
                text: `${a.role} at ${org.name}. ${org.capabilities} ${org.needs}`,
                status: "Confirmed" as Status,
                source:
                  "Saved association; membership does not imply introduction rights",
                date: p.updated_at,
              },
            ]
          : [];
      }),
  ];
}
export function retrieve(question: string, data: Data, privateNotes = true) {
  const words = [...new Set(terms(question))];
  const coalition =
    /coalition|collaborat|complement|pursue|business opportun|launch|expand|expansion/i.test(
      question,
    );
  const customers = /customers?/i.test(question);
  const scored = data.people
    .filter((p) => !customers || p.categories.includes("Customer"))
    .map((p) => {
      const evidence = evidenceFor(p, data, privateNotes);
      const text = terms(
        [
          p.name,
          p.position,
          p.location,
          p.industry,
          ...p.categories,
          ...evidence.map((e) => e.text),
        ].join(" "),
      );
      const hits = words.filter((w) => text.includes(w));
      const capability = terms(
        [
          p.position,
          p.industry,
          p.services,
          p.offers,
          p.skills.join(" "),
          p.resources,
        ].join(" "),
      );
      const capabilityHits = words.filter((w) => capability.includes(w));
      const wantsProvider =
        /\b(print|hire|hiring|recruit|recruiter|developer|design|supplier|provider|provide|sell|services|build|software)\w*/i.test(
          question,
        );
      const substantive = hits.filter((w) => !terms(p.location).includes(w));
      return {
        p,
        evidence,
        score: substantive.length
          ? hits.length +
            capabilityHits.length * (wantsProvider ? 3 : 1) +
            (customers && Boolean(p.services) ? 1 : 0)
          : 0,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const chosen = scored.slice(0, coalition ? 6 : 4);
  // Expand through actual documented person edges; never infer a personal edge from co-membership.
  if (coalition)
    for (const c of [...chosen])
      for (const e of data.relationships.filter(
        (e) =>
          e.verification === "Confirmed" &&
          (e.from_id === c.p.id || e.to_id === c.p.id),
      )) {
        const other = data.people.find(
          (p) => p.id === (e.from_id === c.p.id ? e.to_id : e.from_id),
        );
        if (
          other &&
          !chosen.some((x) => x.p.id === other.id) &&
          chosen.length < 8
        )
          chosen.push({
            p: other,
            evidence: evidenceFor(other, data, privateNotes),
            score: 0,
          });
      }
  return chosen;
}
export function answerQuestion(
  question: string,
  data: Data,
  privateNotes = true,
): Answer {
  const found = retrieve(question, data, privateNotes);
  const isCoalition =
    /coalition|collaborat|complement|launch|expand|opportun/i.test(question);
  return {
    mode: "demo",
    summary: found.length
      ? `${found.length} saved contacts may be relevant. ${isCoalition ? "Their capabilities may be complementary; collaboration is a hypothesis." : "The evidence below explains each match."}`
      : "No supporting match was found in your saved records. Add context or try a more specific service or location.",
    recommendations: found.map(({ p, evidence }) => {
      const relevant = evidence.filter((e) =>
        terms(question).some((t) => terms(e.text).includes(t)),
      );
      return {
        personId: p.id,
        name: p.name,
        why: `Saved profile: ${p.position || p.industry || "contact"}.`,
        evidence: (relevant.length ? relevant : evidence).slice(0, 4),
        path: p.met.trim() ? ["You", p.name] : [],
        hypothesis:
          "This person may help with the objective; willingness, availability and suitability are unconfirmed.",
        verify:
          "Confirm current capacity, scope, pricing, consent to introductions and any relevant qualifications.",
        nextStep: `Reconnect with ${p.name.split(" ")[0]} and ask about this specific need before sharing anyone’s details.`,
        wants: p.needs || "No need recorded; ask first.",
        contributes:
          p.services ||
          p.offers ||
          p.skills.join(", ") ||
          "No capability documented.",
      };
    }),
    economics: {
      problem: isCoalition
        ? "Coordinate the saved capabilities around the proposed objective."
        : "Find a suitable provider for the requested service.",
      payer:
        "The person commissioning the work might pay the provider. A budget owner and spending authority must be verified.",
      demand: found.some((x) => x.p.needs)
        ? "Saved needs exist, but these are not proof of a funded order. See each participant’s evidence."
        : "No demonstrated buyer demand in retrieved records.",
      arrangement:
        "Possible direct service contract or consent-based introduction. Any referral fee requires an explicit agreement.",
      risks:
        "No guaranteed revenue. Verify timing, budget, capabilities, consent, conflicts and commercial terms.",
    },
  };
}
