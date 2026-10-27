export const themeIds = [
  "lime",
  "lilac",
  "ocean",
  "sunset",
  "midnight",
] as const;
export type ThemeId = (typeof themeIds)[number];
export const themeStorageKey = "network-theme-v1";
export const themes = [
  { id: "lime", name: "Lime", colors: ["#f6f5ed", "#d6fa69", "#20291f"] },
  { id: "lilac", name: "Lilac", colors: ["#f5f0fa", "#d7b9ff", "#362746"] },
  { id: "ocean", name: "Ocean", colors: ["#edf5f8", "#89e3ef", "#173748"] },
  { id: "sunset", name: "Sunset", colors: ["#fff3e9", "#ffbd83", "#573326"] },
  {
    id: "midnight",
    name: "Midnight",
    colors: ["#151921", "#c1b1ff", "#303746"],
  },
] as const;
export function validTheme(value: unknown): ThemeId {
  return themeIds.includes(value as ThemeId) ? (value as ThemeId) : "lime";
}
export function readTheme(): ThemeId {
  try {
    return validTheme(localStorage.getItem(themeStorageKey));
  } catch {
    return "lime";
  }
}
export function applyTheme(value: ThemeId) {
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem(themeStorageKey, value);
  } catch {
    /* The current page can still use the chosen theme. */
  }
}
