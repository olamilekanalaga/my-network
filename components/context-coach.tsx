"use client";
import type { Person } from "@/lib/types";
import { missingContext } from "@/lib/network-actions";
export default function ContextCoach({
  people,
  onEdit,
  onImport,
}: {
  people: Person[];
  onEdit: (p: Person) => void;
  onImport: () => void;
}) {
  const incomplete = people
    .map((p) => ({ p, missing: missingContext(p) }))
    .filter((x) => x.missing.length);
  return (
    <section
      className="context-coach"
      aria-label="Build your network intelligence"
    >
      <div>
        <h2>Turn a number into a connection.</h2>
        <p>
          Import contacts → add what you know → find the right person → take
          action.
        </p>
      </div>
      <button className="secondary" onClick={onImport}>
        Import phone contacts
      </button>
      <p className="small">
        {people.length - incomplete.length} of {people.length} profiles cover
        role, capabilities, needs, and how you met. Unknown is okay; ask rather
        than guess.
      </p>
      <div className="context-list">
        {incomplete.slice(0, 3).map(({ p, missing }) => (
          <button key={p.id} onClick={() => onEdit(p)}>
            <strong>{p.name}</strong>
            <span>Add: {missing.join(" · ")}</span>
            <b>Add context →</b>
          </button>
        ))}
      </div>
      {!incomplete.length && (
        <p>
          Your profiles have the key context. Ask your network a specific
          question below.
        </p>
      )}
    </section>
  );
}
