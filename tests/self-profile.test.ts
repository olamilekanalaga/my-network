import test from "node:test";
import assert from "node:assert/strict";
import {
  blankSelfProfile,
  readSelfProfile,
  selfProfileSchema,
  roleStepSchema,
  roleDraftSchema,
  mergeDemoProfile,
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

test("role step requires handwritten detail and a company for founders and owners", () => {
  for (const role of ["Business owner", "Founder"]) {
    assert.equal(
      roleStepSchema.safeParse({
        role,
        roleDescription: "Building tools",
        companyName: "",
      }).success,
      false,
    );
    assert.equal(
      roleStepSchema.safeParse({
        role,
        roleDescription: "Building tools",
        companyName: "Acme",
      }).success,
      true,
    );
  }
  assert.equal(
    roleStepSchema.safeParse({
      role: "Agency",
      roleDescription: "Recruitment",
      companyName: "",
    }).success,
    true,
  );
  assert.equal(
    roleStepSchema.safeParse({
      role: "Skilled worker / Talent",
      roleDescription: "Data analyst",
    }).success,
    true,
  );
  assert.equal(
    roleStepSchema.safeParse({ role: "Agency", roleDescription: " " }).success,
    false,
  );
});
test("older saved profiles remain readable when new detail fields are absent", () => {
  const { roleDescription, companyName, ...legacy } = {
    ...blankSelfProfile(),
    role: "Recruiter",
    name: "Jamie",
    goal: "Meet people",
  };
  const restored = readSelfProfile(legacy);
  assert.equal(restored?.role, "Recruiter");
  assert.equal(restored?.companyName, "");
  assert.equal(restored?.roleDescription, "");
});

test("blank demo setup uses a fictional profile and partial input wins over defaults", () => {
  const defaults = mergeDemoProfile(blankSelfProfile());
  assert.equal(defaults.name, "Alex Morgan");
  assert.ok(defaults.goal);
  assert.ok(defaults.companyName);
  const partial = mergeDemoProfile({
    ...blankSelfProfile(),
    role: "Skilled worker / Talent",
    name: "  Sam  ",
    roleDescription: "Data analyst",
    goal: "Get my first client",
  });
  assert.equal(partial.name, "Sam");
  assert.equal(partial.roleDescription, "Data analyst");
  assert.equal(partial.offers, "Data analyst");
  assert.equal(partial.goal, "Get my first client");
  assert.equal(partial.companyName, "");
  assert.equal(roleDraftSchema.safeParse(blankSelfProfile()).success, true);
  assert.equal(roleStepSchema.safeParse(blankSelfProfile()).success, false);
});
