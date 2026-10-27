import test from "node:test";
import assert from "node:assert/strict";
import {
  blankSelfProfile,
  readSelfProfile,
  selfProfileSchema,
} from "../lib/self-profile";
test("self profile requires a real name, valid audience, and a goal", () => {
  assert.equal(readSelfProfile(blankSelfProfile()), null);
  const profile = {
    ...blankSelfProfile(),
    name: "  Jordan  ",
    role: "Recruiter",
    goal: "  Find designers  ",
  };
  const saved = selfProfileSchema.parse(profile);
  assert.equal(saved.name, "Jordan");
  assert.equal(saved.goal, "Find designers");
  assert.equal(readSelfProfile({ ...profile, role: "Admin" }), null);
  assert.equal(readSelfProfile({ ...profile, goal: " " }), null);
  assert.equal(readSelfProfile({ ...profile, name: "x".repeat(101) }), null);
});
test("corrupt or unrelated profile data returns to setup", () => {
  for (const value of [null, "invalid", {}, [], { name: "Alice" }])
    assert.equal(readSelfProfile(value), null);
  assert.equal(
    selfProfileSchema.parse({
      ...blankSelfProfile(),
      name: "Alice",
      goal: "Meet collaborators",
      owner_id: "another-user",
    }).name,
    "Alice",
  );
  assert.ok(
    !(
      "owner_id" in
      selfProfileSchema.parse({
        ...blankSelfProfile(),
        name: "Alice",
        goal: "Meet collaborators",
        owner_id: "another-user",
      })
    ),
  );
});
