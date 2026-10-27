"use client";
import { useEffect, useState } from "react";
import { Plus, Search, StickyNote, Trash2, UserRound } from "lucide-react";
import {
  allNotes,
  blankNote,
  noteActivity,
  noteKinds,
  type Note,
} from "@/lib/notes";
import type { Activity, Person } from "@/lib/types";
import { Field, Modal, Empty } from "./ui";
export default function NotesBoard({
  activities,
  people,
  compose,
  onSave,
  onDelete,
  onContact,
  onUseForContact,
}: {
  activities: Activity[];
  people: Person[];
  compose?: { id: string; contactId: string | null } | null;
  onSave: (activity: Activity) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onContact: (id: string) => void;
  onUseForContact: (note: Note) => void;
}) {
  const [editing, setEditing] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (compose) {
      setEditing(blankNote(compose.contactId));
      setContact(compose.contactId || "");
      setSearch("");
      setError("");
    }
  }, [compose]);
  const notes = allNotes(activities).filter(
    (n) =>
      (!contact || n.contactId === contact) &&
      [n.title, n.body, people.find((p) => p.id === n.contactId)?.name || ""]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await onSave(noteActivity(editing));
      setEditing(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="notes-board">
      <div className="notes-heading">
        <h1>Notes</h1>
        <button
          className="primary"
          onClick={() => {
            setEditing(blankNote());
            setError("");
          }}
        >
          <Plus size={16} />
          New note
        </button>
      </div>
      <div className="notes-tools">
        <div className="search">
          <Search size={16} />
          <input
            aria-label="Search notes"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter notes by contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        >
          <option value="">All notes</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {error && !editing && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="notes-grid">
        {notes.map((note) => {
          const person = people.find((p) => p.id === note.contactId);
          return (
            <article className="note-card" key={note.id}>
              <button
                className="note-open"
                onClick={() => {
                  setEditing(note);
                  setError("");
                }}
              >
                <span className="note-kind">
                  <StickyNote size={14} />
                  {note.kind}
                </span>
                <h2>{note.title || note.body.split("\n")[0].slice(0, 65)}</h2>
                <p>{note.body}</p>
              </button>
              <div className="note-card-bottom">
                <small>{new Date(note.updatedAt).toLocaleDateString()}</small>
                {person && (
                  <button
                    className="text-link"
                    onClick={() => onContact(person.id)}
                  >
                    <UserRound size={12} />
                    {person.name}
                  </button>
                )}
                <button
                  className="icon"
                  aria-label={`Delete note ${note.title || note.body.slice(0, 30)}`}
                  onClick={async () => {
                    if (!confirm("Delete this note?")) return;
                    try {
                      await onDelete(note.id);
                    } catch (err) {
                      setError((err as Error).message);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!notes.length && (
        <Empty>Jot it down. Link a contact now or later.</Empty>
      )}
      {editing && (
        <Modal
          title={
            allNotes(activities).some((n) => n.id === editing.id)
              ? "Edit note"
              : "New note"
          }
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form onSubmit={save}>
            <div className="form-grid">
              <Field label="Type">
                <select
                  value={editing.kind}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      kind: e.target.value as Note["kind"],
                    })
                  }
                >
                  {noteKinds.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </Field>
              <Field label="Contact (optional)">
                <select
                  value={editing.contactId || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      contactId: e.target.value || null,
                    })
                  }
                >
                  <option value="">No contact</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Title (optional)">
              <input
                value={editing.title}
                maxLength={150}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Note">
              <textarea
                autoFocus
                rows={8}
                maxLength={8000}
                placeholder="A thought, a meeting, something to remember…"
                value={editing.body}
                onChange={(e) =>
                  setEditing({ ...editing, body: e.target.value })
                }
              />
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="actions">
              <button
                className="primary"
                disabled={busy || !editing.body.trim()}
              >
                Save note
              </button>
              {editing.contactId && (
                <button
                  className="secondary"
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const activity = noteActivity(editing);
                      await onSave(activity);
                      onUseForContact(editing);
                      setEditing(null);
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Use in contact profile
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
