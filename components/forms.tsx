"use client";
import { useState } from "react";
import { PhotoPicker, ProfileLinks } from "./profile-media";
import { normalizeLinks, profileLinksSchema } from "@/lib/profile-media";
import FAQ from "./faq";
import {
  companyNotes,
  companyLinks,
  linkedCompany,
  saveCompanyNotes,
  type CompanyDraft,
} from "@/lib/company";
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
  data,
  onSave,
  onClose,
  busy,
  error,
}: {
  person: Person;
  data?: Data;
  onSave: (p: Person, company?: CompanyDraft) => void;
  onClose: () => void;
  busy: boolean;
  error?: string;
}) {
  const [p, setP] = useState(person);
  const [formError, setFormError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const linked = data ? linkedCompany(person.id, data) : null;
  const [companyName, setCompanyName] = useState(
    linked?.company.name === "Company (name not added)"
      ? ""
      : linked?.company.name || "",
  );
  const [socials, setSocials] = useState<string[]>(
    linked ? companyLinks(linked.company) : [],
  );
  const set = (key: keyof Person, value: unknown) =>
    setP((prev) => ({ ...prev, [key]: value }));
  const input = (key: keyof Person, label: string, kind = "text") => (
    <Field label={label} key={key}>
      {kind === "textarea" ? (
        <textarea
          rows={3}
          value={String(p[key])}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <input
          type={kind}
          value={String(p[key])}
          onChange={(e) => set(key, e.target.value)}
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
          setFormError("");
          const personal = profileLinksSchema.safeParse(
            normalizeLinks(p.links),
          );
          const company = profileLinksSchema.safeParse(normalizeLinks(socials));
          if (!personal.success || !company.success) {
            setFormError("Use a valid website or social profile URL.");
            return;
          }
          if (p.name.trim())
            onSave(
              {
                ...p,
                name: p.name.trim(),
                links: personal.data,
                updated_at: new Date().toISOString(),
              },
              {
                id: linked?.company.id,
                name: companyName,
                links: company.data,
              },
            );
        }}
      >
        <PhotoPicker
          name={p.name}
          sampleKey={p.id}
          value={p.photo}
          onChange={(photo) => set("photo", photo)}
          onBusyChange={setPhotoBusy}
        />
        <div className="form-grid">
          {input("name", "Full name *")}
          {input("position", "Position / role")}
          {input("email", "Email", "email")}
          {input("phone", "Phone", "tel")}
        </div>
        <ProfileLinks
          value={p.links}
          onChange={(links) => set("links", links)}
        />
        <p className="small muted">Add the rest whenever you know it.</p>
        <FAQ
          items={[
            {
              id: "company",
              question: "Company details (optional)",
              answer: (
                <>
                  <Field label="Company name">
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </Field>
                  <ProfileLinks
                    label="Company website or socials"
                    value={socials}
                    onChange={setSocials}
                  />
                </>
              ),
            },
            {
              id: "needs",
              question: "What do they need?",
              answer: input("needs", "Needs (optional)", "textarea"),
            },
            {
              id: "offers",
              question: "What can they offer?",
              answer: (
                <>
                  {input("offers", "Offers (optional)", "textarea")}
                  {input(
                    "services",
                    "Services / products (optional)",
                    "textarea",
                  )}
                </>
              ),
            },
            {
              id: "building",
              question: "What are they building?",
              answer: input("building", "Building (optional)", "textarea"),
            },
            {
              id: "skills",
              question: "Skills & resources",
              answer: (
                <>
                  <Field label="Skills (comma separated)">
                    <input
                      value={p.skills.join(", ")}
                      onChange={(e) =>
                        set(
                          "skills",
                          e.target.value.split(",").map((v) => v.trim()),
                        )
                      }
                    />
                  </Field>
                  {input("resources", "Resources (optional)", "textarea")}
                </>
              ),
            },
            {
              id: "context",
              question: "How do you know them?",
              answer: (
                <>
                  {input("met", "Where you met (optional)")}
                  {input("met_date", "When you met (optional)", "date")}
                  {input("location", "Location (optional)")}
                  {input("industry", "Industry (optional)")}
                </>
              ),
            },
            {
              id: "private",
              question: "Private notes",
              answer: (
                <>
                  {input("notes", "Conversation notes (optional)", "textarea")}
                  {input("transcript", "Transcript (optional)", "textarea")}
                  {input(
                    "promises",
                    "Promises / agreements (optional)",
                    "textarea",
                  )}
                </>
              ),
            },
            {
              id: "labels",
              question: "Labels & source",
              answer: (
                <>
                  <Multi
                    options={[...categories]}
                    value={p.categories}
                    onChange={(value) => set("categories", value)}
                  />
                  <Field label="Verification">
                    <select
                      value={p.verification}
                      onChange={(e) => set("verification", e.target.value)}
                    >
                      {["Confirmed", "Publicly observed", "Inferred"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Relationship strength">
                    <select
                      value={p.strength}
                      onChange={(e) => set("strength", Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}/5
                        </option>
                      ))}
                    </select>
                  </Field>
                  {input("source", "Source (optional)")}
                  {input(
                    "consent",
                    "Sharing restrictions (optional)",
                    "textarea",
                  )}
                </>
              ),
            },
          ]}
        />
        {(formError || error) && (
          <p className="error" role="alert">
            {formError || error}
          </p>
        )}
        <button
          className="primary wide"
          disabled={busy || photoBusy || !p.name.trim()}
        >
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
    organization
      ? { ...organization, notes: companyNotes(organization.notes).notes }
      : {
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
  const [socials, setSocials] = useState<string[]>(
    organization ? companyLinks(organization) : [],
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
          onSave({
            ...o,
            name:
              o.name.trim() ||
              (o.kind === "Company" ? "Company (name not added)" : o.kind),
            website: normalizeLinks(socials)[0] || "",
            notes: saveCompanyNotes(o.notes, normalizeLinks(socials)),
          });
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
        <Field
          label={
            o.kind === "Company" ? "Company name (optional)" : "Name (optional)"
          }
        >
          <input
            value={o.name}
            onChange={(e) => setO({ ...o, name: e.target.value })}
          />
        </Field>
        <ProfileLinks
          label="Company website or socials"
          value={socials}
          onChange={setSocials}
        />
        <FAQ
          items={[
            {
              id: "description",
              question: "About (optional)",
              answer: (
                <Field label="Description">
                  <textarea
                    rows={3}
                    value={o.description}
                    onChange={(e) =>
                      setO({ ...o, description: e.target.value })
                    }
                  />
                </Field>
              ),
            },
            {
              id: "offers",
              question: "What can they offer?",
              answer: (
                <Field label="Capabilities / products">
                  <textarea
                    rows={3}
                    value={o.capabilities}
                    onChange={(e) =>
                      setO({ ...o, capabilities: e.target.value })
                    }
                  />
                </Field>
              ),
            },
            {
              id: "needs",
              question: "What do they need?",
              answer: (
                <Field label="Needs (optional)">
                  <textarea
                    rows={3}
                    value={o.needs}
                    onChange={(e) => setO({ ...o, needs: e.target.value })}
                  />
                </Field>
              ),
            },
            {
              id: "context",
              question: "Other details (optional)",
              answer: (
                <>
                  <Field label="Industry">
                    <input
                      value={o.industry}
                      onChange={(e) => setO({ ...o, industry: e.target.value })}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      value={o.location}
                      onChange={(e) => setO({ ...o, location: e.target.value })}
                    />
                  </Field>
                  {o.kind === "Event" && (
                    <Field label="Event date">
                      <input
                        type="date"
                        value={o.event_date}
                        onChange={(e) =>
                          setO({ ...o, event_date: e.target.value })
                        }
                      />
                    </Field>
                  )}
                  <Field label="Notes">
                    <textarea
                      rows={3}
                      value={o.notes}
                      onChange={(e) => setO({ ...o, notes: e.target.value })}
                    />
                  </Field>
                </>
              ),
            },
          ]}
        />
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
