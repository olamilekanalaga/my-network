"use client";
import { useState } from "react";
import { Modal, Field } from "./ui";
import {
  actionKinds,
  introductionContacts,
  introductionDraft,
  contactLinks,
  messageDraft,
  type ActionKind,
} from "@/lib/network-actions";
import { type Person, type Activity, type Data, uid } from "@/lib/types";
export default function NetworkAction({
  person,
  data,
  goal,
  onClose,
  onSave,
}: {
  person: Person;
  data: Data;
  goal: string;
  onClose: () => void;
  onSave: (activity: Activity) => Promise<unknown>;
}) {
  const [kind, setKind] = useState<ActionKind>("Contact");
  const [message, setMessage] = useState(() =>
    messageDraft(person, goal, "Contact"),
  );
  const [recipientId, setRecipientId] = useState(person.id);
  const recipient = data.people.find((p) => p.id === recipientId) || person;
  const connectors = introductionContacts(person, data);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const links = contactLinks(
    recipient,
    message,
    `${kind}: ${goal || "Let’s connect"}`,
  );
  async function save() {
    setBusy(true);
    setStatus("");
    try {
      await onSave({
        id: uid(),
        person_id: recipient.id,
        opportunity_id: null,
        text: `${kind} with ${recipient.name}${recipient.id !== person.id ? ` for ${person.name}` : ""}: ${goal || "Follow up"}\nDraft (not sent):\n${message}`,
        date,
        done: false,
      });
      setStatus("Follow-up saved. Your message has not been sent.");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Take the next step with ${person.name}`} onClose={onClose}>
      <p>
        Review your draft, then open your own email or messaging app to send it.
      </p>
      <Field label="What would you like to do?">
        <select
          value={kind}
          onChange={(e) => {
            const value = e.target.value as ActionKind;
            setKind(value);
            setRecipientId(person.id);
            setMessage(messageDraft(person, goal, value));
            setStatus("");
          }}
        >
          {actionKinds.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </Field>
      {kind === "Request introduction" && (
        <Field label="Who should receive the request?">
          <select
            value={recipientId}
            onChange={(e) => {
              const selected =
                data.people.find((p) => p.id === e.target.value) || person;
              setRecipientId(selected.id);
              setMessage(
                selected.id === person.id
                  ? messageDraft(person, goal, kind)
                  : introductionDraft(selected, person, goal),
              );
              setStatus("");
            }}
          >
            <option value={person.id}>
              {person.name} — ask who they recommend
            </option>
            {connectors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — recorded connection to {person.name}
              </option>
            ))}
          </select>
          <small>
            {connectors.length
              ? "Based on confirmed saved relationships. Verify they still know each other."
              : "No confirmed intermediary recorded. Add real relationships in Network to find an introduction route."}
          </small>
        </Field>
      )}
      <p className="small">
        Recipient: {recipient.name}. Opening a draft does not send it.
      </p>
      <Field label="Message draft">
        <textarea
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>
      <p className="small">
        Sharing restrictions:{" "}
        {recipient.consent ||
          "No sharing permission recorded. Ask before sharing details."}
      </p>
      <div className="action-links">
        {links.email && (
          <a className="primary" href={links.email}>
            Open email draft
          </a>
        )}
        {links.sms && (
          <a className="secondary" href={links.sms}>
            Open text draft
          </a>
        )}
        {links.phone && (
          <a className="secondary" href={links.phone}>
            Call
          </a>
        )}
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              setStatus("Draft copied.");
            } catch {
              setStatus("Copy unavailable. Select and copy the draft above.");
            }
          }}
        >
          Copy draft
        </button>
      </div>
      {!links.email && !links.phone && (
        <p>
          No email or phone saved. Copy the draft to your preferred channel, or
          add contact details to the profile.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="Follow-up date">
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <button className="primary" disabled={busy || !date || !message.trim()}>
          Save follow-up & draft
        </button>
      </form>
      <p role="status">{status}</p>
    </Modal>
  );
}
