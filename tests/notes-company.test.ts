import test from "node:test";
import assert from "node:assert/strict";
import { blankNote, noteActivity, readNote, allNotes } from "../lib/notes";
import {
  companyNotes,
  saveCompanyNotes,
  companyLinks,
  companyForDraft,
} from "../lib/company";
import { blankPerson, emptyData } from "../lib/types";
import { deletePerson } from "../lib/import";
import { schemas } from "../lib/validation";
import { questionHistory } from "../lib/wallet";
import { answerQuestion } from "../lib/intelligence";
test("private notes persist as validated completed activities without entering questions or follow-ups", () => {
  const note = {
    ...blankNote(),
    body: "Remember this idea",
    kind: "Idea" as const,
  };
  const activity = noteActivity(note);
  assert.equal(schemas.activities.safeParse(activity).success, true);
  assert.equal(activity.done, true);
  assert.equal(readNote(activity)?.body, note.body);
  assert.equal(questionHistory([activity]).length, 0);
  assert.deepEqual(
    allNotes([
      { ...activity, text: "Ordinary activity" },
      { ...activity, text: "Private note · broken" },
    ]),
    [],
  );
  assert.throws(() => noteActivity({ ...note, body: " " }));
});
test("deleting a linked contact preserves the note and clears its contact reference", () => {
  const p = { ...blankPerson(), name: "Contact" };
  const d = emptyData();
  d.people = [p];
  d.activities = [
    noteActivity({ ...blankNote(p.id), body: "Memory of meeting" }),
  ];
  const deleted = deletePerson(d, p.id);
  assert.equal(readNote(deleted.activities[0])?.contactId, null);
  assert.equal(readNote(deleted.activities[0])?.body, "Memory of meeting");
});
test("new notes are not silently used as contact evidence", () => {
  const p = { ...blankPerson(), name: "Contact" };
  const d = emptyData();
  d.people = [p];
  d.activities = [
    noteActivity({ ...blankNote(p.id), body: "Cryptography specialist" }),
  ];
  assert.equal(
    answerQuestion("cryptography", d, true).recommendations.length,
    0,
  );
});
test("company social links round-trip without overwriting human notes or accepting unsafe URLs", () => {
  const text = saveCompanyNotes("Keep this private note", [
    "linkedin.com/company/example",
    "https://example.com",
  ]);
  const parsed = companyNotes(text);
  assert.equal(parsed.notes, "Keep this private note");
  assert.deepEqual(parsed.links, [
    "https://linkedin.com/company/example",
    "https://example.com",
  ]);
  assert.equal(saveCompanyNotes(text, []), "Keep this private note");
  assert.throws(() => saveCompanyNotes("", ["javascript:alert(1)"]));
  assert.deepEqual(
    companyLinks({
      id: "",
      kind: "Company",
      name: "",
      industry: "",
      location: "",
      description: "",
      capabilities: "",
      needs: "",
      website: "https://example.com",
      event_date: "",
      notes: text,
    }),
    ["https://example.com", "https://linkedin.com/company/example"],
  );
});

test("changing one contact's company does not rename the shared organization", () => {
  const previous = {
    id: crypto.randomUUID(),
    kind: "Company" as const,
    name: "Original Company",
    industry: "Technology",
    location: "London",
    description: "Keep original context",
    capabilities: "",
    needs: "",
    website: "https://original.example",
    event_date: "",
    notes: "Original private notes",
  };
  const next = companyForDraft(
    { id: previous.id, name: "New Company", links: ["https://new.example"] },
    previous,
  );
  assert.notEqual(next.id, previous.id);
  assert.equal(previous.name, "Original Company");
  assert.equal(next.description, "");
  const same = companyForDraft(
    {
      id: previous.id,
      name: previous.name,
      links: ["https://updated.example"],
    },
    previous,
  );
  assert.equal(same.id, previous.id);
  assert.equal(companyNotes(same.notes).notes, previous.notes);
});
