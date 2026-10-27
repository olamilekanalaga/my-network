import test from "node:test";
import assert from "node:assert/strict";
import { contactsFromDevice } from "../lib/device-contacts";
import { parseContacts } from "../lib/import";
import { schemas } from "../lib/validation";
test("phone contacts keep basic details and can be completed with the manual contact schema", () => {
  const [contact] = contactsFromDevice([
    {
      name: ["  Ada Lovelace  "],
      email: ["ada@example.test"],
      tel: ["+44 7700 900123"],
    },
  ]);
  assert.equal(contact.name, "Ada Lovelace");
  assert.equal(contact.email, "ada@example.test");
  assert.equal(contact.phone, "+44 7700 900123");
  assert.equal(contact.verification, "Inferred");
  assert.equal(contact.needs, "");
  assert.equal(
    schemas.people.safeParse({
      ...contact,
      position: "Data analyst",
      needs: "New projects",
      skills: ["Analytics"],
    }).success,
    true,
  );
});
test("contacts without a name retain an email or phone identifier", () => {
  const contacts = contactsFromDevice([
    { tel: ["+44 7700 900123"] },
    { email: ["person@example.test"] },
    {},
  ]);
  assert.equal(contacts.length, 2);
  assert.equal(contacts[0].name, "+44 7700 900123");
  assert.equal(contacts[1].name, "person@example.test");
  const cards = parseContacts(
    "BEGIN:VCARD\nVERSION:3.0\nTEL:+44 7700 900123\nEND:VCARD",
    "contact.vcf",
  );
  assert.equal(cards[0].name, "+44 7700 900123");
});
test("phone import enforces the batch limit", () => {
  assert.throws(
    () =>
      contactsFromDevice(
        Array.from({ length: 2001 }, () => ({ name: ["Contact"] })),
      ),
    /2,000/,
  );
});
