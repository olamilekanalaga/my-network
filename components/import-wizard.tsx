"use client";
import { useRef, useState } from "react";
import { Check, Smartphone, ArrowRight } from "lucide-react";
import { Modal, Badge, Avatar, Field } from "./ui";
import { duplicateOf, mergePeople, parseContacts } from "@/lib/import";
import { contactsFromDevice, type DeviceContact } from "@/lib/device-contacts";
import { normalizeLinks, profileLinksSchema } from "@/lib/profile-media";
import { blankPerson, type Person } from "@/lib/types";
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
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Person[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [stage, setStage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [policy, setPolicy] = useState("skip"),
    [savedCount, setSavedCount] = useState(0),
    [existingCount, setExistingCount] = useState(0),
    [editable, setEditable] = useState<Person[]>([]);
  function preview(contacts: Person[]) {
    if (!contacts.length) {
      setError(
        "No contacts found. Choose another contact card or add a contact manually.",
      );
      return;
    }
    setRows(contacts);
    setSelected(contacts.map((p) => p.id));
    setStage(2);
    setError("");
  }
  async function file(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (!/\.vcf$/i.test(file.name))
        throw new Error(
          "Choose a contact card (.vcf) shared from your contacts app.",
        );
      if (file.size > 5_000_000)
        throw new Error("Choose a contact card smaller than 5 MB.");
      preview(
        parseContacts(await file.text(), file.name).map((person) => ({
          ...person,
          links: normalizeLinks(person.links).filter(
            (url) => profileLinksSchema.element.safeParse(url).success,
          ),
        })),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function device() {
    setError("");
    const contacts = (
      navigator as unknown as {
        contacts?: {
          select: (
            fields: string[],
            options: { multiple: boolean },
          ) => Promise<DeviceContact[]>;
          getProperties?: () => Promise<string[]>;
        };
      }
    ).contacts;
    if (!contacts?.select) {
      input.current?.click();
      return;
    }
    setBusy(true);
    try {
      const available = contacts.getProperties
        ? await contacts.getProperties()
        : ["name", "email", "tel"];
      const fields = ["name", "email", "tel"].filter((field) =>
        available.includes(field),
      );
      if (!fields.length)
        throw new Error(
          "This browser cannot read contact details. Add the contact manually instead.",
        );
      preview(
        contactsFromDevice(await contacts.select(fields, { multiple: true })),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof DOMException &&
          ["NotAllowedError", "SecurityError"].includes(err.name)
          ? "Contacts weren’t shared. Try again or add a contact manually."
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    let working = [...people];
    const ready = new Map<string, Person>();
    let count = 0,
      skipped = 0;
    try {
      for (const person of rows.filter((p) => selected.includes(p.id))) {
        const duplicate = duplicateOf(person, working);
        if (duplicate && policy === "skip") {
          ready.set(duplicate.id, duplicate);
          skipped++;
          continue;
        }
        const result = duplicate ? mergePeople(duplicate, person) : person;
        await onSave(result);
        count++;
        working = [...working.filter((p) => p.id !== result.id), result];
        ready.set(result.id, result);
      }
      setSavedCount(count);
      setExistingCount(skipped);
      setEditable([...ready.values()]);
      setStage(3);
    } catch (err) {
      setError(
        `${count} saved before import stopped. You can retry; duplicates will be checked. ${(err as Error).message}`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Import contacts"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="steps">
        {["Choose", "Review", "Add details"].map((label, i) => (
          <span key={label} className={stage === i + 1 ? "active" : ""}>
            {i + 1}. {label}
          </span>
        ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {stage === 1 ? (
        <div className="contact-import-start">
          <span className="contact-import-icon">
            <Smartphone size={30} />
          </span>
          <button
            className="primary wide"
            disabled={busy}
            onClick={() => void device()}
          >
            <Smartphone size={17} />
            {busy ? "Opening contacts…" : "Import from contacts"}
          </button>
          <input
            ref={input}
            type="file"
            aria-label="Choose contact card"
            accept=".vcf,text/vcard,text/x-vcard"
            hidden
            onChange={(e) => {
              const selected = e.target.files?.[0];
              e.target.value = "";
              void file(selected);
            }}
          />
          <p className="small muted">
            Select contacts from your phone, or choose a shared contact card
            (.vcf) if your browser can’t open the address book.
          </p>
          <button className="text-link" onClick={() => onEnrich(blankPerson())}>
            Add a contact manually
            <ArrowRight size={14} />
          </button>
        </div>
      ) : stage === 2 ? (
        <>
          <div className="section-title">
            <span>{selected.length} selected</span>
            <button
              className="text-link"
              onClick={() =>
                setSelected(
                  selected.length === rows.length ? [] : rows.map((p) => p.id),
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
                    disabled={busy}
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p.id]
                          : selected.filter((id) => id !== p.id),
                      )
                    }
                  />
                  <Avatar
                    name={p.name}
                    photo={duplicate?.photo || p.photo}
                    sampleKey={duplicate?.id || p.id}
                  />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.email || p.phone || ""}</small>
                    {duplicate && (
                      <Badge tone="amber">Already in contacts</Badge>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          <Field label="Existing contacts">
            <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
              <option value="skip">Keep existing details</option>
              <option value="merge">Add missing details</option>
            </select>
          </Field>
          <button
            className="primary wide"
            disabled={busy || !selected.length}
            onClick={() => void commit()}
          >
            {busy ? "Importing…" : "Import selected contacts"}
          </button>
          <button
            className="text-link"
            disabled={busy}
            onClick={() => setStage(1)}
          >
            Choose contacts again
          </button>
        </>
      ) : (
        <>
          <span className="success-icon">
            <Check size={26} />
          </span>
          <h3>{savedCount} imported</h3>
          {existingCount > 0 && (
            <p className="small muted">{existingCount} already in Contacts.</p>
          )}
          <p className="small muted">Add details now or later.</p>
          <div className="import-list">
            {editable.map((p) => (
              <button
                className="person-row wide"
                key={p.id}
                onClick={() => onEnrich(p)}
                aria-label={`Add details for ${p.name}`}
              >
                <Avatar name={p.name} photo={p.photo} sampleKey={p.id} />
                <strong>{p.name}</strong>
                <span className="text-link push">
                  Add details
                  <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
          <button className="primary wide" onClick={onClose}>
            Done
          </button>
        </>
      )}
    </Modal>
  );
}
