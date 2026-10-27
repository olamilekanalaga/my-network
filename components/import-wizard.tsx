"use client";
import { useState } from "react";
import { Upload, Check, Smartphone, Link2 } from "lucide-react";
import { Modal, Badge, Avatar } from "./ui";
import { parseContacts, duplicateOf, mergePeople } from "@/lib/import";
import { blankPerson, type Person } from "@/lib/types";
import { browserDb, configured, getGoogleToken } from "@/lib/supabase";
export default function ImportWizard({
  people,
  onSave,
  onClose,
  onEnrich,
}: {
  people: Person[];
  onSave: (p: Person) => Promise<unknown>;
  onClose: () => void;
  onEnrich: (p: Person) => void;
}) {
  const [rows, setRows] = useState<Person[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [stage, setStage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [policy, setPolicy] = useState("skip"),
    [count, setCount] = useState(0);
  const [saved, setSaved] = useState<Person[]>([]);
  function preview(items: Person[]) {
    setRows(items);
    setSelected(items.map((x) => x.id));
    setStage(2);
    setError("");
  }
  async function file(f?: File) {
    if (!f) return;
    try {
      if (f.size > 5_000_000) throw new Error("Maximum file size is 5 MB.");
      preview(parseContacts(await f.text(), f.name));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function device() {
    try {
      const n = navigator as unknown as {
        contacts?: {
          select: (
            fields: string[],
            options: { multiple: boolean },
          ) => Promise<{ name?: string[]; email?: string[]; tel?: string[] }[]>;
        };
      };
      if (!n.contacts)
        throw new Error(
          "Contact Picker is unavailable in this browser. Export contacts as CSV or VCF, then upload them here.",
        );
      const contacts = await n.contacts.select(["name", "email", "tel"], {
        multiple: true,
      });
      preview(
        contacts
          .map((c) => ({
            ...blankPerson(),
            name: c.name?.[0] || "",
            email: c.email?.[0] || "",
            phone: c.tel?.[0] || "",
            source: "Device contact picker",
            verification: "Inferred" as const,
          }))
          .filter((p) => p.name),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      if (!configured())
        throw new Error(
          "Configure Supabase and Google OAuth first. CSV and VCF imports work without external services.",
        );
      const db = browserDb();
      const {
        data: { session },
      } = await db.auth.getSession();
      if (!session)
        throw new Error(
          "Sign in with Google in Settings using Contacts permission, then return here.",
        );
      if (!getGoogleToken() && !session.provider_token)
        throw new Error(
          "Google token is unavailable. Reconnect Google in Settings; provider tokens are never saved by this app.",
        );
      const r = await fetch("/api/google-contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerToken: getGoogleToken() || session.provider_token,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      preview(
        result
          .map(
            (c: {
              names?: { displayName: string }[];
              emailAddresses?: { value: string }[];
              phoneNumbers?: { value: string }[];
              organizations?: { title?: string; name?: string }[];
            }) => ({
              ...blankPerson(),
              name: c.names?.[0]?.displayName || "",
              email: c.emailAddresses?.[0]?.value || "",
              phone: c.phoneNumbers?.[0]?.value || "",
              position:
                c.organizations?.[0]?.title || c.organizations?.[0]?.name || "",
              source: "Google Contacts import",
              verification: "Inferred" as const,
            }),
          )
          .filter((p: Person) => p.name),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    let working = [...people];
    const completed: Person[] = [];
    try {
      for (const p of rows.filter((p) => selected.includes(p.id))) {
        const duplicate = duplicateOf(p, working);
        if (duplicate && policy === "skip") continue;
        const result = duplicate ? mergePeople(duplicate, p) : p;
        await onSave(result);
        working = [...working.filter((x) => x.id !== result.id), result];
        completed.push(result);
        setCount((n) => n + 1);
      }
      setSaved(completed);
      setStage(3);
    } catch (e) {
      setError(
        `Import stopped after ${completed.length} saved contacts. Retry safely: existing matches will be detected. ${(e as Error).message}`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Bring your network together" onClose={onClose}>
      <div className="steps">
        {["Import", "Select & review", "Add context"].map((s, i) => (
          <span key={s} className={stage === i + 1 ? "active" : ""}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {stage === 1 ? (
        <>
          <p className="muted">
            A contact is a starting point. You decide what the app learns about
            them.
          </p>
          <label className="dropzone">
            <Upload size={30} />
            <strong>Import CSV or vCard</strong>
            <span>Name, email, phone — we’ll handle the basics.</span>
            <input
              aria-label="Import contact file"
              type="file"
              accept=".csv,.vcf"
              onChange={(e) => file(e.target.files?.[0])}
            />
            <span className="small">Up to 2,000 contacts · 5 MB</span>
          </label>
          <div className="two-buttons">
            <button className="secondary" onClick={device}>
              <Smartphone size={16} /> Device contacts
            </button>
            <button className="secondary" disabled={busy} onClick={google}>
              <Link2 size={16} /> Google Contacts
            </button>
          </div>
          <a className="text-link" href="/sample-contacts.csv" download>
            Download sample CSV
          </a>
          <p className="small muted">
            Google requires OAuth configuration and your permission. Device
            support varies; CSV and VCF are always available.
          </p>
        </>
      ) : stage === 2 ? (
        <>
          <div className="section-title">
            <span>
              {selected.length} of {rows.length} selected
            </span>
            <button
              className="text-link"
              onClick={() =>
                setSelected(
                  selected.length === rows.length ? [] : rows.map((x) => x.id),
                )
              }
            >
              {selected.length === rows.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="import-list">
            {rows.map((p) => {
              const duplicate = duplicateOf(p, people);
              return (
                <label className="import-row" key={p.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p.id]
                          : selected.filter((x) => x !== p.id),
                      )
                    }
                  />
                  <Avatar name={p.name} photo={p.photo} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.email || p.phone || "No contact details"}</small>
                    {duplicate && (
                      <Badge tone="amber">
                        Possible duplicate: {duplicate.name}
                      </Badge>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          <label className="field">
            <span>Possible duplicate handling</span>
            <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
              <option value="skip">Skip duplicates</option>
              <option value="merge">
                Merge into existing: fill blanks, preserve existing context
              </option>
            </select>
          </label>
          <button
            className="primary wide"
            disabled={busy || !selected.length}
            onClick={commit}
          >
            {busy ? `Saving… ${count}` : "Import selected contacts"}
          </button>
          <button className="text-link" onClick={() => setStage(1)}>
            Choose another source
          </button>
        </>
      ) : (
        <>
          <div className="success-icon">
            <Check size={26} />
          </div>
          <h3>{saved.length} contacts saved</h3>
          <p className="muted">
            Now add context to the people who matter. Their needs and
            capabilities help the assistant make useful connections.
          </p>
          {saved.slice(0, 20).map((p) => (
            <button
              className="person-row wide"
              key={p.id}
              onClick={() => onEnrich(p)}
            >
              <Avatar name={p.name} photo={p.photo} />
              <strong>{p.name}</strong>
              <span className="text-link push">Add context →</span>
            </button>
          ))}
          {!saved.length && (
            <p>All selected contacts were duplicates and were skipped.</p>
          )}
          <button className="primary wide" onClick={onClose}>
            Done
          </button>
        </>
      )}
    </Modal>
  );
}
