"use client";
import { useState } from "react";
import { Field, Modal, Multi } from "./ui";
import {
  categories,
  stages,
  type Person,
  type Organization,
  type Opportunity,
  type Data,
  uid,
} from "@/lib/types";
export function PersonForm({
  person,
  onSave,
  onClose,
  busy,
}: {
  person: Person;
  onSave: (p: Person) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [p, setP] = useState(person);
  const set = (k: keyof Person, v: unknown) => setP((x) => ({ ...x, [k]: v }));
  const input = (k: keyof Person, label: string, kind = "text") => (
    <Field key={k} label={label}>
      {kind === "textarea" ? (
        <textarea
          value={String(p[k])}
          onChange={(e) => set(k, e.target.value)}
        />
      ) : (
        <input
          type={kind}
          value={String(p[k])}
          onChange={(e) => set(k, e.target.value)}
        />
      )}
    </Field>
  );
  return (
    <Modal
      title={person.name ? "Edit relationship" : "Add a person"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (p.name.trim())
            onSave({
              ...p,
              name: p.name.trim(),
              updated_at: new Date().toISOString(),
            });
        }}
      >
        <p className="muted">
          Start with the basics. Add what you actually know; leave unknown
          details empty.
        </p>
        <div className="context-guide">
          <strong>Four things that make matching useful</strong>
          <p>
            Who are they? What can they provide? What do they need? How do you
            know them?
          </p>
          <small>
            A phone number doesn’t answer these questions. Record only what you
            know, then ask them to confirm the rest.
          </small>
        </div>
        <div className="form-grid">
          {input("name", "Full name *")}
          {input("position", "Position / company")}
          {input("email", "Email", "email")}
          {input("phone", "Phone", "tel")}
          {input("location", "Location")}
          {input("industry", "Industry")}
          {input("photo", "Photo URL (optional)", "url")}
        </div>
        <Field label="Categories — choose any that apply">
          <Multi
            options={[...categories]}
            value={p.categories}
            onChange={(v) => set("categories", v)}
          />
        </Field>
        <Field label="Skills (comma separated)">
          <input
            value={p.skills.join(", ")}
            onChange={(e) =>
              set(
                "skills",
                e.target.value.split(",").map((x) => x.trim()),
              )
            }
          />
        </Field>
        {input(
          "services",
          "What can they provide? Services / products",
          "textarea",
        )}
        {input("building", "What they are building", "textarea")}
        {input("needs", "What do they need?", "textarea")}
        {input("offers", "What they can offer", "textarea")}
        {input("resources", "Resources and access they control", "textarea")}
        <div className="form-grid">
          {input("met", "How do you know them? Where did you meet?")}
          {input("met_date", "When we met", "date")}
        </div>
        {input("notes", "Private conversation notes", "textarea")}
        {input("transcript", "Voice-note transcript (paste text)", "textarea")}
        {input(
          "promises",
          "Promises / agreements (record exact scope)",
          "textarea",
        )}
        <Field label="Professional links (one per line)">
          <textarea
            value={p.links.join("\n")}
            onChange={(e) =>
              set("links", e.target.value.split("\n").filter(Boolean))
            }
          />
        </Field>
        <div className="form-grid">
          <Field label="Relationship strength">
            <select
              value={p.strength}
              onChange={(e) => set("strength", Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          </Field>
          <Field label="Verification">
            <select
              value={p.verification}
              onChange={(e) => set("verification", e.target.value)}
            >
              {["Confirmed", "Publicly observed", "Inferred"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        {input("source", "Source of profile information")}
        {input("consent", "Consent / sharing restrictions", "textarea")}
        <button className="primary wide" disabled={busy || !p.name.trim()}>
          Save profile
        </button>
      </form>
    </Modal>
  );
}
export function OrganizationForm({
  organization,
  onSave,
  onClose,
}: {
  organization?: Organization;
  onSave: (o: Organization) => void;
  onClose: () => void;
}) {
  const [o, setO] = useState<Organization>(
    organization || {
      id: uid(),
      kind: "Company",
      name: "",
      industry: "",
      location: "",
      description: "",
      capabilities: "",
      needs: "",
      website: "",
      event_date: "",
      notes: "",
    },
  );
  return (
    <Modal
      title={
        organization ? "Edit network record" : "Add company, community or event"
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(o);
        }}
      >
        <Field label="Type">
          <select
            value={o.kind}
            onChange={(e) =>
              setO({ ...o, kind: e.target.value as Organization["kind"] })
            }
          >
            {["Company", "Community", "Event"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        {(
          [
            "name",
            "industry",
            "location",
            "description",
            "capabilities",
            "needs",
            "website",
            "event_date",
            "notes",
          ] as const
        ).map((k) => (
          <Field key={k} label={k.replace("_", " ")}>
            <input
              required={k === "name"}
              type={k === "event_date" ? "date" : "text"}
              value={o[k]}
              onChange={(e) => setO({ ...o, [k]: e.target.value })}
            />
          </Field>
        ))}
        <button className="primary wide">Save network record</button>
      </form>
    </Modal>
  );
}
export function OpportunityForm({
  opportunity,
  data,
  onSave,
  onClose,
}: {
  opportunity?: Opportunity;
  data: Data;
  onSave: (o: Opportunity) => void;
  onClose: () => void;
}) {
  const [o, setO] = useState<Opportunity>(
    opportunity || {
      id: uid(),
      title: "",
      status: "Discovered",
      person_ids: [],
      organization_ids: [],
      value: null,
      potential_fee: null,
      agreed_fee: null,
      follow_up: "",
      notes: "",
      outcome: "",
    },
  );
  return (
    <Modal title="Track an opportunity" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(o);
        }}
      >
        <Field label="Opportunity title *">
          <input
            required
            value={o.title}
            onChange={(e) => setO({ ...o, title: e.target.value })}
          />
        </Field>
        <Field label="Stage">
          <select
            value={o.status}
            onChange={(e) =>
              setO({ ...o, status: e.target.value as Opportunity["status"] })
            }
          >
            {stages.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="People involved">
          <Multi
            options={data.people.map((p) => p.name)}
            value={data.people
              .filter((p) => o.person_ids.includes(p.id))
              .map((p) => p.name)}
            onChange={(v) =>
              setO({
                ...o,
                person_ids: data.people
                  .filter((p) => v.includes(p.name))
                  .map((p) => p.id),
              })
            }
          />
        </Field>
        <Field label="Companies / communities / events">
          <Multi
            options={data.organizations.map((p) => p.name)}
            value={data.organizations
              .filter((p) => o.organization_ids.includes(p.id))
              .map((p) => p.name)}
            onChange={(v) =>
              setO({
                ...o,
                organization_ids: data.organizations
                  .filter((p) => v.includes(p.name))
                  .map((p) => p.id),
              })
            }
          />
        </Field>
        <div className="form-grid">
          {(["value", "potential_fee", "agreed_fee"] as const).map((k) => (
            <Field key={k} label={`${k.replaceAll("_", " ")} (GBP, optional)`}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={o[k] ?? ""}
                onChange={(e) =>
                  setO({
                    ...o,
                    [k]: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
          ))}
          <Field label="Follow-up date">
            <input
              type="date"
              value={o.follow_up}
              onChange={(e) => setO({ ...o, follow_up: e.target.value })}
            />
          </Field>
        </div>
        <p className="notice">
          Potential fee is an estimate. Record an agreed fee only after an
          explicit agreement.
        </p>
        <Field label="Notes, participants’ contributions, buyer and evidence">
          <textarea
            value={o.notes}
            onChange={(e) => setO({ ...o, notes: e.target.value })}
          />
        </Field>
        <Field label="Outcome">
          <textarea
            value={o.outcome}
            onChange={(e) => setO({ ...o, outcome: e.target.value })}
          />
        </Field>
        <button className="primary wide">Save opportunity</button>
      </form>
    </Modal>
  );
}
