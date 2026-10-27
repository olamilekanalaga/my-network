import { z } from "zod";
export function safePhotoUrl(value: string): string {
  if (!value || value.length > 18000) return "";
  if (value === "/demo-profile.svg") return value;
  if (/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))
    return value;
  try {
    const url = new URL(value);
    return value.length <= 2000 && ["https:", "http:"].includes(url.protocol)
      ? value
      : "";
  } catch {
    return "";
  }
}
export const photoSchema = z
  .string()
  .max(18000)
  .refine(
    (value) => !value || Boolean(safePhotoUrl(value)),
    "Choose a photo or use an HTTP/HTTPS image URL.",
  );
export function normalizeLinks(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) =>
      /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
    );
}
export const profileLinksSchema = z
  .array(
    z
      .string()
      .trim()
      .max(1000)
      .refine((value) => {
        try {
          const u = new URL(value);
          return (
            ["http:", "https:"].includes(u.protocol) && Boolean(u.hostname)
          );
        } catch {
          return false;
        }
      }, "Use a valid website or social profile URL."),
  )
  .max(100);
