import test from "node:test";
import assert from "node:assert/strict";
import {
  blankSelfProfile,
  readSelfProfile,
  selfProfileSchema,
  roleStepSchema,
  roleDraftSchema,
  mergeDemoProfile,
  demoProfileForDisplay,
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

test("identity details support a distinct display name and employer", () => {
  const p = selfProfileSchema.parse({
    ...blankSelfProfile(),
    name: "Alex Morgan",
    displayName: "⭕️La_Crrypt💰₿",
    workCompany: "Studio North",
    headline: "Community lead",
    goal: "Meet people",
  });
  assert.equal(p.displayName, "⭕️La_Crrypt💰₿");
  assert.equal(p.name, "Alex Morgan");
  assert.equal(p.workCompany, "Studio North");
  const demo = mergeDemoProfile(blankSelfProfile());
  assert.equal(demo.displayName, "⭕️La_Crrypt💰₿");
  assert.equal(demo.photo, "/demo-profile.svg");
  const custom = mergeDemoProfile({
    ...blankSelfProfile(),
    displayName: "My handle",
    workCompany: "My workplace",
  });
  assert.equal(custom.displayName, "My handle");
  assert.equal(custom.workCompany, "My workplace");
});

test("demo identity upgrades the stock sample without replacing custom details", () => {
  const stock = demoProfileForDisplay({
    ...blankSelfProfile(),
    name: "Alex Morgan",
    goal: "Meet people",
  });
  assert.equal(stock.displayName, "⭕️La_Crrypt💰₿");
  assert.equal(stock.photo, "/demo-profile.svg");
  assert.equal(stock.workCompany, "Studio North");
  const custom = demoProfileForDisplay({
    ...blankSelfProfile(),
    name: "Jamie",
    displayName: "Jay",
    workCompany: "My employer",
    headline: "Engineer",
    goal: "Meet people",
  });
  assert.equal(custom.displayName, "Jay");
  assert.equal(custom.workCompany, "My employer");
  assert.equal(custom.headline, "Engineer");
  assert.equal(custom.photo, "");
});
