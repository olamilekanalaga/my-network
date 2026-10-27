import test from "node:test";
import assert from "node:assert/strict";
import { themes, themeIds, validTheme } from "../lib/themes";
import { blankSelfProfile, selfProfileSchema } from "../lib/self-profile";
import { normalizeLinks } from "../lib/profile-media";
test("five themes have unique identifiers and invalid stored values fall back safely", () => {
  assert.equal(new Set(themes.map((t) => t.id)).size, 5);
  assert.equal(themeIds.length, 5);
  for (const theme of themes) assert.equal(validTheme(theme.id), theme.id);
  assert.equal(validTheme("<script>"), "lime");
  assert.equal(validTheme(null), "lime");
});
test("optional profiles retain empty details and persist each valid theme", () => {
  for (const theme of themeIds) {
    const saved = selfProfileSchema.parse({ ...blankSelfProfile(), theme });
    assert.equal(saved.name, "");
    assert.equal(saved.goal, "");
    assert.equal(saved.role, "");
    assert.equal(saved.theme, theme);
    assert.deepEqual(saved.links, []);
  }
  assert.equal(
    selfProfileSchema.safeParse({ ...blankSelfProfile(), theme: "invalid" })
      .success,
    false,
  );
  assert.deepEqual(normalizeLinks(["", "  "]), []);
});
