import test from "node:test";
import assert from "node:assert/strict";
import { blankPerson, emptyData } from "../lib/types";
import {
  introductionContacts,
  introductionDraft,
  missingContext,
  contactLinks,
  messageDraft,
} from "../lib/network-actions";
import { answerQuestion, retrieve } from "../lib/intelligence";

test("imported contact gaps identify each missing piece without inventing context", () => {
  const p = { ...blankPerson(), name: "Jamie", phone: "+44 7700 900123" };
  assert.equal(missingContext(p).length, 4);
  assert.deepEqual(
    missingContext({
      ...p,
      position: "Founder",
      services: "Web design",
      needs: "Accounting support",
      met: "At a meetup",
    }),
    [],
  );
});
test("contact links encode message text and reject unsafe or invalid destinations", () => {
  const p = {
    ...blankPerson(),
    name: "Jamie",
    email: "jamie@example.com",
    phone: "+44 7700 900123",
  };
  const links = contactLinks(p, "Hello & thanks?", "A & B");
  assert.ok(links.email?.includes("body=Hello%20%26%20thanks%3F"));
  assert.equal(links.phone, "tel:+447700900123");
  assert.equal(
    contactLinks(
      { ...p, phone: "javascript:alert(1)", email: "bad\n@example.com" },
      "",
      "",
    ).phone,
    null,
  );
  assert.equal(
    contactLinks({ ...p, email: "bad\n@example.com" }, "", "").email,
    null,
  );
});
test("introduction and purchase drafts ask permission and do not claim an agreement", () => {
  const p = { ...blankPerson(), name: "Jamie Lee" };
  assert.match(
    messageDraft(p, "find a designer", "Request introduction"),
    /check with them before sharing/,
  );
  assert.match(
    messageDraft(p, "print brochures", "Discuss purchase"),
    /not an order/,
  );
});
test("providers rank ahead of buyers and location alone does not justify a match", () => {
  const data = emptyData();
  const buyer = {
    ...blankPerson(),
    name: "Buyer",
    needs: "Need printing",
    location: "London",
  };
  const supplier = {
    ...blankPerson(),
    name: "Printer",
    services: "Printing brochures",
    location: "London",
  };
  const unrelated = {
    ...blankPerson(),
    name: "Other",
    services: "Accounting",
    location: "London",
  };
  data.people = [buyer, unrelated, supplier];
  const result = retrieve("Who can print brochures in London?", data, false);
  assert.equal(result[0].p.id, supplier.id);
  assert.ok(!result.some((x) => x.p.id === unrelated.id));
  assert.deepEqual(
    answerQuestion("print brochures", data).recommendations[0].path,
    [],
  );
});

test("introduction recipients require confirmed personal relationships", () => {
  const data = emptyData();
  const target = { ...blankPerson(), name: "Target" };
  const connector = { ...blankPerson(), name: "Connector" };
  const inferred = { ...blankPerson(), name: "Inferred" };
  data.people = [target, connector, inferred];
  data.relationships = [
    {
      id: "one",
      from_id: connector.id,
      to_id: target.id,
      label: "Knows",
      verification: "Confirmed",
      source: "Recorded conversation",
    },
    {
      id: "two",
      from_id: inferred.id,
      to_id: target.id,
      label: "Maybe",
      verification: "Inferred",
      source: "Guess",
    },
  ];
  assert.deepEqual(
    introductionContacts(target, data).map((p) => p.id),
    [connector.id],
  );
  assert.match(
    introductionDraft(connector, target, "find a partner"),
    /Hi Connector/,
  );
  assert.match(
    introductionDraft(connector, target, "find a partner"),
    /Target/,
  );
});
