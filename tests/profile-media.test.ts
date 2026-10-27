import test from "node:test";
import assert from "node:assert/strict";
import {
  safePhotoUrl,
  photoSchema,
  normalizeLinks,
  profileLinksSchema,
} from "../lib/profile-media";
import {
  blankSelfProfile,
  readSelfProfile,
  profileRoles,
  mergeDemoProfile,
} from "../lib/self-profile";
import { schemas } from "../lib/validation";
import { blankPerson } from "../lib/types";
test("photos accept bounded thumbnails and web URLs and reject unsafe formats", () => {
  assert.ok(photoSchema.safeParse("data:image/jpeg;base64,/9j/AA==").success);
  assert.equal(safePhotoUrl("javascript:alert(1)"), "");
  assert.equal(safePhotoUrl("data:image/svg+xml,<svg/>"), "");
  assert.equal(
    safePhotoUrl("https://example.com/face.jpg"),
    "https://example.com/face.jpg",
  );
  assert.equal(
    photoSchema.safeParse("data:image/jpeg;base64," + "A".repeat(18000))
      .success,
    false,
  );
  assert.ok(
    schemas.people.safeParse({
      ...blankPerson(),
      name: "Contact",
      photo: "data:image/jpeg;base64,/9j/AA==",
    }).success,
  );
});
test("optional profile links normalize websites and reject executable links", () => {
  const links = normalizeLinks([
    " linkedin.com/in/alex ",
    "",
    "https://example.com/work",
  ]);
  assert.deepEqual(links, [
    "https://linkedin.com/in/alex",
    "https://example.com/work",
  ]);
  assert.ok(profileLinksSchema.safeParse(links).success);
  assert.equal(
    profileLinksSchema.safeParse(["javascript:alert(1)"]).success,
    false,
  );
  assert.equal(
    profileLinksSchema.safeParse(["data:text/html,hello"]).success,
    false,
  );
  assert.ok(profileLinksSchema.safeParse([]).success);
});
test("removed main roles migrate without losing personal details or typed descriptions", () => {
  assert.ok(
    !profileRoles.some(
      (role) =>
        (role as string) === "Job seeker" ||
        (role as string) === "Business developer",
    ),
  );
  for (const role of ["Business developer", "Job seeker"]) {
    const p = readSelfProfile({
      ...blankSelfProfile(),
      name: "Alex",
      goal: "Build connections",
      role,
      roleDescription: "Independent consultant",
      photo: "https://example.com/photo.jpg",
      links: ["https://example.com/work"],
    });
    assert.equal(p?.role, "Skilled worker / Talent");
    assert.equal(p?.roleDescription, "Independent consultant");
    assert.equal(p?.photo, "https://example.com/photo.jpg");
    assert.deepEqual(p?.links, ["https://example.com/work"]);
  }
});
test("demo defaults keep selected photos and optional links", () => {
  const p = mergeDemoProfile({
    ...blankSelfProfile(),
    photo: "https://example.com/photo.jpg",
    links: ["https://example.com/work"],
  });
  assert.equal(p.photo, "https://example.com/photo.jpg");
  assert.equal(p.links.length, 1);
});

test("only the bundled demo illustration is allowed as a local avatar path", () => {
  assert.equal(safePhotoUrl("/demo-profile.svg"), "/demo-profile.svg");
  assert.equal(safePhotoUrl("/untrusted.svg"), "");
  assert.equal(safePhotoUrl("data:image/svg+xml,<svg/>"), "");
});
