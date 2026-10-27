import test from "node:test";
import assert from "node:assert/strict";
import { demoData } from "../lib/demo";
import {
  parseContacts,
  duplicateOf,
  mergePeople,
  deletePerson,
} from "../lib/import";
import { answerQuestion, graphPath, retrieve } from "../lib/intelligence";
import { schemas } from "../lib/validation";
import { blankPerson } from "../lib/types";
test("CSV supports quoted commas, selective records and Google-style headers", () => {
  const rows = parseContacts(
    'Name,Email,Services\n"Jones, Maya",maya@test.test,"Print, design"\nSam,sam@test.test,Software',
    "test.csv",
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "Jones, Maya");
  assert.equal(rows[0].services, "Print, design");
  assert.equal(rows[0].verification, "Inferred");
});
test("VCF unfolds lines and decodes escaped values", () => {
  const p = parseContacts(
    "BEGIN:VCARD\r\nFN:Maya\\, Jones\r\nEMAIL;TYPE=WORK:maya@test.test\r\nTITLE:Long\r\n title\r\nEND:VCARD",
    ".vcf",
  )[0];
  assert.equal(p.name, "Maya, Jones");
  assert.equal(p.position, "Longtitle");
  assert.equal(p.email, "maya@test.test");
});
test("invalid file formats and excessive imports fail clearly", () => {
  assert.throws(() => parseContacts("x", ".exe"));
  assert.throws(() => parseContacts("a".repeat(5_000_001), ".csv"));
  assert.throws(() =>
    parseContacts("name\n" + Array(2002).fill("Sam").join("\n"), ".csv"),
  );
});
test("duplicate matches email, normalized phone and name; merge preserves existing facts", () => {
  const a = {
    ...blankPerson(),
    name: "Maya",
    email: "MAYA@test.test",
    notes: "Keep me",
    categories: ["Customer"],
  };
  const b = {
    ...blankPerson(),
    name: "Maya Jones",
    email: "maya@test.test",
    notes: "Do not overwrite",
    categories: ["Supplier"],
    location: "London",
  };
  assert.equal(duplicateOf(b, [a])?.id, a.id);
  const m = mergePeople(a, b);
  assert.equal(m.id, a.id);
  assert.equal(m.notes, "Keep me");
  assert.equal(m.location, "London");
  assert.deepEqual(m.categories, ["Customer", "Supplier"]);
});
test("all demo records validate against production schemas", () => {
  const d = demoData();
  for (const t of Object.keys(d) as (keyof typeof d)[])
    for (const row of d[t])
      assert.equal(
        schemas[t].safeParse(row).success,
        true,
        `${t}: ${JSON.stringify(row)}`,
      );
});
test("multi-category customer can be retrieved as a printing supplier", () => {
  const d = demoData();
  const a = answerQuestion("Who can print 5,000 event materials in London?", d);
  assert(a.recommendations.some((r) => r.name === "Maya Thompson"));
  const maya = a.recommendations.find((r) => r.name === "Maya Thompson")!;
  assert(maya.evidence.some((e) => e.text.includes("printing")));
  assert.deepEqual(maya.path, ["You", "Maya Thompson"]);
  assert(maya.hypothesis.includes("unconfirmed"));
});
test("reciprocal customer query uses customer directory", () => {
  const a = answerQuestion(
    "Which customers also provide services I need?",
    demoData(),
  );
  assert(a.recommendations.length);
  assert(
    a.recommendations.every((r) =>
      ["Maya Thompson", "Amara Bello"].includes(r.name),
    ),
  );
});
test("unsupported question returns no invented contact", () => {
  const a = answerQuestion("Who repairs submarines in Antarctica?", demoData());
  assert.equal(a.recommendations.length, 0);
});
test("pending facts and private notes are excluded from external AI context by default choice", () => {
  const d = demoData();
  d.people[0].notes = "Secret submarine capability";
  d.facts.push({
    id: crypto.randomUUID(),
    person_id: d.people[0].id,
    text: "Pending submarine fleet",
    source_url: "https://example.com",
    confidence: 1,
    observed_at: "2026-10-27",
    status: "pending",
    verification: "Publicly observed",
    visibility: "public",
  });
  assert.equal(retrieve("submarine", d, false).length, 0);
  assert.equal(retrieve("submarine", d, true).length, 1);
});
test("graph query uses documented edges and never treats co-attendance as a personal relationship", () => {
  const d = demoData();
  const p = (name: string) => d.people.find((x) => x.name === name)!.id;
  assert.equal(graphPath(d, p("Sophie Chen"), p("Ethan Brooks")).length, 2);
  assert.deepEqual(graphPath(d, p("Maya Thompson"), p("Daniel Okoro")), []);
  d.relationships[0].verification = "Publicly observed";
  assert.deepEqual(graphPath(d, p("Sophie Chen"), p("Ethan Brooks")), []);
});
test("coalition retrieval finds complementary recorded UK fintech and Nigerian capabilities", () => {
  const a = answerQuestion(
    "Build a coalition to help a Nigerian fintech expand into the UK",
    demoData(),
  );
  for (const name of ["Amara Bello", "Ethan Brooks", "Sophie Chen"])
    assert(a.recommendations.some((r) => r.name === name));
  assert(a.economics.demand.includes("not proof"));
  assert(a.economics.arrangement.includes("agreement"));
});
test("deletion removes private data and references while preserving opportunity history", () => {
  const d = demoData();
  const id = d.people[0].id;
  const result = deletePerson(d, id);
  assert(!result.people.some((x) => x.id === id));
  assert(!result.facts.some((x) => x.person_id === id));
  assert(!result.transactions.some((x) => x.person_id === id));
  assert(!result.opportunities.some((x) => x.person_ids.includes(id)));
  assert(result.opportunities.length);
});
test("validation rejects invalid pipeline, negative fee, empty name and self edge", () => {
  assert(!schemas.people.safeParse({ ...blankPerson(), name: "" }).success);
  assert(
    !schemas.opportunities.safeParse({
      ...demoData().opportunities[0],
      agreed_fee: -1,
    }).success,
  );
  assert(
    !schemas.opportunities.safeParse({
      ...demoData().opportunities[0],
      status: "Paid maybe",
    }).success,
  );
  const r = demoData().relationships[0];
  assert(!schemas.relationships.safeParse({ ...r, to_id: r.from_id }).success);
});
