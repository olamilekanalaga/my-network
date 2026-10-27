import { blankPerson, type Person } from "./types";
export type DeviceContact = {
  name?: string[];
  email?: string[];
  tel?: string[];
};
export function contactsFromDevice(contacts: DeviceContact[]): Person[] {
  if (contacts.length > 2000)
    throw new Error("Select up to 2,000 contacts at a time.");
  const first = (value: unknown) =>
    Array.isArray(value)
      ? value
          .find((v): v is string => typeof v === "string" && Boolean(v.trim()))
          ?.trim() || ""
      : "";
  return contacts
    .map((contact) => {
      const email = first(contact.email),
        phone = first(contact.tel),
        name = first(contact.name) || email || phone;
      return {
        ...blankPerson(),
        name: name.slice(0, 200),
        email,
        phone,
        source: "Phone contacts",
        verification: "Inferred" as const,
      };
    })
    .filter((p) => p.name);
}
