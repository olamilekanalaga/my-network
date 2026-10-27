import test from "node:test";
import assert from "node:assert/strict";
import { blankPerson } from "../lib/types";
import {
  contactCounts,
  inContactLayer,
  questionActivity,
  questionHistory,
} from "../lib/wallet";
import { answerQuestion } from "../lib/intelligence";
import { emptyData } from "../lib/types";
import { schemas } from "../lib/validation";
test("wallet counts use saved labels and skills, allow overlap, and ignore blank skills", () => {
  const founder = {
    ...blankPerson(),
    name: "Founder",
    categories: ["Founder"],
    skills: ["Design"],
  };
  const skilled = {
    ...blankPerson(),
    name: "Worker",
    categories: ["Skilled worker"],
    skills: [],
  };
  const unknown = {
    ...blankPerson(),
    name: "Unlabeled Founder",
    position: "Founder",
    skills: [" "],
  };
  assert.deepEqual(contactCounts([founder, skilled, unknown]), {
    total: 3,
    founders: 1,
    skilled: 2,
    incomplete: 3,
  });
  assert.equal(inContactLayer(unknown, "Founders"), false);
  assert.equal(inContactLayer(unknown, "Skilled workers"), false);
});
test("successful questions persist as completed activities with accurate historic match counts", () => {
  const answer = answerQuestion("Find a designer", emptyData());
  const activity = questionActivity("Find a designer", answer);
  assert.equal(schemas.activities.safeParse(activity).success, true);
  assert.equal(activity.done, true);
  const history = questionHistory([
    activity,
    { ...activity, id: crypto.randomUUID(), text: "Normal follow-up" },
    { ...activity, id: crypto.randomUUID(), done: false },
  ]);
  assert.equal(history.length, 1);
  assert.equal(history[0].question, "Find a designer");
  assert.equal(history[0].matches, 0);
});
test("invalid question activity data cannot break the home ledger", () => {
  const base = questionActivity("hello", answerQuestion("hello", emptyData()));
  assert.deepEqual(
    questionHistory([
      { ...base, text: "Asked my network · invalid" },
      { ...base, text: 'Asked my network · {"question":"x"}' },
    ]),
    [],
  );
});
