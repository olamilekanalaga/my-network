export const categories = [
  "Customer",
  "Supplier",
  "Founder",
  "Investor",
  "Friend",
  "Community",
  "Professional",
] as const;
export const stages = [
  "Discovered",
  "Researching",
  "Introduction Requested",
  "Introduced",
  "Negotiating",
  "Won",
  "Lost",
  "Paused",
] as const;
export type Status = "Confirmed" | "Publicly observed" | "Inferred";
export type Visibility = "private" | "public" | "shareable";
export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  location: string;
  position: string;
  industry: string;
  categories: string[];
  skills: string[];
  services: string;
  building: string;
  needs: string;
  offers: string;
  resources: string;
  links: string[];
  met: string;
  met_date: string;
  notes: string;
  transcript: string;
  promises: string;
  strength: number;
  source: string;
  verification: Status;
  updated_at: string;
  consent: string;
}
export interface Organization {
  id: string;
  kind: "Company" | "Community" | "Event";
  name: string;
  industry: string;
  location: string;
  description: string;
  capabilities: string;
  needs: string;
  website: string;
  event_date: string;
  notes: string;
}
export interface Affiliation {
  id: string;
  person_id: string;
  organization_id: string;
  role: string;
}
export interface Relationship {
  id: string;
  from_id: string;
  to_id: string;
  label: string;
  verification: Status;
  source: string;
}
export interface Fact {
  id: string;
  person_id: string;
  text: string;
  source_url: string;
  observed_at: string;
  confidence: number;
  status: "pending" | "approved";
  verification: Status;
  visibility: Visibility;
}
export interface Transaction {
  id: string;
  person_id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  direction: "received" | "paid";
  notes: string;
}
export interface Opportunity {
  id: string;
  title: string;
  status: (typeof stages)[number];
  person_ids: string[];
  organization_ids: string[];
  value: number | null;
  potential_fee: number | null;
  agreed_fee: number | null;
  follow_up: string;
  notes: string;
  outcome: string;
}
export interface Activity {
  id: string;
  person_id: string | null;
  opportunity_id: string | null;
  text: string;
  date: string;
  done: boolean;
}
export interface Data {
  people: Person[];
  organizations: Organization[];
  affiliations: Affiliation[];
  relationships: Relationship[];
  facts: Fact[];
  transactions: Transaction[];
  opportunities: Opportunity[];
  activities: Activity[];
}
export type Table = keyof Data;
export const tables: Table[] = [
  "people",
  "organizations",
  "affiliations",
  "relationships",
  "facts",
  "transactions",
  "opportunities",
  "activities",
];
export const uid = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
export function blankPerson(): Person {
  return {
    id: uid(),
    name: "",
    email: "",
    phone: "",
    photo: "",
    location: "",
    position: "",
    industry: "",
    categories: [],
    skills: [],
    services: "",
    building: "",
    needs: "",
    offers: "",
    resources: "",
    links: [],
    met: "",
    met_date: "",
    notes: "",
    transcript: "",
    promises: "",
    strength: 3,
    source: "Manually entered",
    verification: "Confirmed",
    updated_at: new Date().toISOString(),
    consent: "Private personal record; sharing not approved",
  };
}
export const emptyData = (): Data => ({
  people: [],
  organizations: [],
  affiliations: [],
  relationships: [],
  facts: [],
  transactions: [],
  opportunities: [],
  activities: [],
});
