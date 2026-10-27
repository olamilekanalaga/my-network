"use client";
import { useState } from "react";
import { ArrowUp, Sparkles, ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { answerQuestion, graphPath, type Answer } from "@/lib/intelligence";
import { browserDb } from "@/lib/supabase";
import { type Data, type Opportunity, type Person, uid } from "@/lib/types";
import { Avatar, Badge, SafeLink } from "./ui";
const defaultPrompts = [
  "Who can print 5,000 event materials in London?",
  "Which customers also provide services I need?",
  "Build a coalition to help a Nigerian fintech expand into the UK.",
];
export default function Assistant({
  prompts = defaultPrompts,
  onAction,
  data,
  mode,
  allowAI,
  privateNotes,
  onSave,
  onPerson,
}: {
  onAction: (person: Person, goal: string) => void;
  prompts?: readonly string[];
  data: Data;
  mode: string;
  allowAI: boolean;
  privateNotes: boolean;
  onSave: (o: Opportunity) => void;
  onPerson: (id: string) => void;
}) {
  const [q, setQ] = useState(""),
    [answer, setAnswer] = useState<Answer | null>(null),
    [last, setLast] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function ask(question: string) {
    if (!question.trim()) return;
    setBusy(true);
    setError("");
    setLast(question);
    try {
      if (mode === "demo" || !allowAI)
        setAnswer(answerQuestion(question, data, privateNotes));
      else {
        const {
          data: { session },
        } = await browserDb().auth.getSession();
        if (!session) throw new Error("Sign in again.");
        const r = await fetch("/api/assistant", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question, allowAI, privateNotes }),
        });
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setAnswer(body);
      }
      setQ("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (!answer) return;
    onSave({
      id: uid(),
      title: last.slice(0, 150),
      status: "Discovered",
      person_ids: answer.recommendations.map((r) => r.personId),
      organization_ids: [],
      value: null,
      potential_fee: null,
      agreed_fee: null,
      follow_up: "",
      notes: [
        `Question: ${last}`,
        answer.summary,
        ...answer.recommendations.map(
          (r) =>
            `${r.name}\nWants: ${r.wants}\nContributes: ${r.contributes}\nHypothesis: ${r.hypothesis}\nEvidence: ${r.evidence.map((e) => `${e.text} [${e.id}]`).join("; ")}\nNext: ${r.nextStep}`,
        ),
        ...Object.entries(answer.economics).map(([k, v]) => `${k}: ${v}`),
      ].join("\n\n"),
      outcome: "",
    });
  }
  return (
    <section className="assistant">
      <div className="assistant-heading">
        <span className="ai-icon">
          <Sparkles size={21} />
        </span>
        <div>
          <h2>Ask your network</h2>
          <p>Find a person. Start something good.</p>
        </div>
        <Badge tone="light">
          {mode === "demo"
            ? "Demo · evidence engine"
            : allowAI
              ? "AI enabled"
              : "Local matching"}
        </Badge>
      </div>
      <form
        className="ask-box"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <textarea
          aria-label="Ask your network"
          placeholder="Who in my network could help with…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={2000}
        />
        <button
          aria-label="Send question"
          className="send"
          disabled={busy || !q.trim()}
        >
          <ArrowUp size={20} />
        </button>
      </form>
      <div className="prompt-list">
        {prompts.map((p) => (
          <button key={p} onClick={() => ask(p)} disabled={busy}>
            {p}
            <ArrowRight size={13} />
          </button>
        ))}
      </div>
      <p className="assistant-footer">
        <ShieldCheck size={13} />
        {mode === "demo"
          ? "Uses only your local demo records. No data is sent to AI."
          : allowAI
            ? "Only retrieved records are sent with your approval. Private notes are optional."
            : "Matches saved records on this device. No records are sent to AI."}
      </p>
      {busy && (
        <p role="status">Searching saved records and relationship paths…</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {answer && (
        <div className="answer">
          <div className="question-bubble">{last}</div>
          <div className="answer-title">
            <Sparkles size={17} />
            <strong>Connections worth exploring</strong>
          </div>
          <p>{answer.summary}</p>
          <div className="recommendations">
            {answer.recommendations.map((r) => (
              <article key={r.personId} className="recommendation">
                <button
                  className="person-row"
                  onClick={() => onPerson(r.personId)}
                >
                  <Avatar name={r.name} />
                  <span>
                    <strong>{r.name}</strong>
                    <small>{r.why}</small>
                  </span>
                  <ArrowRight size={17} className="push" />
                </button>
                <div className="path">
                  {!r.path.length && (
                    <small>
                      Saved contact · how you know them is not recorded
                    </small>
                  )}
                  {r.path.map((p, i) => (
                    <span key={i}>
                      {i > 0 && <ArrowRight size={12} />}
                      <b>{p}</b>
                    </span>
                  ))}
                </div>
                <dl className="brief">
                  <dt>Wants</dt>
                  <dd>{r.wants}</dd>
                  <dt>Contributes</dt>
                  <dd>{r.contributes}</dd>
                </dl>
                <details>
                  <summary>Saved evidence · {r.evidence.length}</summary>
                  {r.evidence.map((e) => (
                    <div className="evidence" key={e.id}>
                      <Badge
                        tone={
                          e.status === "Confirmed"
                            ? "green"
                            : e.status === "Publicly observed"
                              ? "blue"
                              : "amber"
                        }
                      >
                        {e.status}
                      </Badge>
                      <p>“{e.text}”</p>
                      <small>
                        Source:{" "}
                        {e.source.startsWith("http") ? (
                          <SafeLink url={e.source} />
                        ) : (
                          e.source
                        )}{" "}
                        · {e.date.slice(0, 10)}
                      </small>
                      <code>{e.id}</code>
                    </div>
                  ))}
                </details>
                <p>
                  <Badge tone="amber">Inferred</Badge> {r.hypothesis}
                </p>
                <p className="small">
                  <b>Verify:</b> {r.verify}
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    const person = data.people.find((p) => p.id === r.personId);
                    if (person) onAction(person, last);
                  }}
                >
                  Contact or request an introduction
                </button>
                <p className="next-step">
                  <b>Next step</b> {r.nextStep}
                </p>
              </article>
            ))}
          </div>
          {answer.recommendations.length > 1 && (
            <details className="economics" open>
              <summary>Possible coalition & commercial logic</summary>
              {Object.entries(answer.economics).map(([k, v]) => (
                <p key={k}>
                  <b>{k[0].toUpperCase() + k.slice(1)}:</b> {v}
                </p>
              ))}
              {answer.recommendations.slice(1).map((r) => {
                const first = answer.recommendations[0];
                const path = graphPath(data, first.personId, r.personId);
                return (
                  <p className="small" key={r.personId}>
                    {path.length
                      ? `Documented path: ${path.map((id) => data.people.find((p) => p.id === id)?.name || data.organizations.find((o) => o.id === id)?.name || "Record").join(" → ")}`
                      : `No documented personal path between ${first.name} and ${r.name}. You can request consent separately; shared membership is not an introduction.`}
                  </p>
                );
              })}
            </details>
          )}
          {answer.recommendations.length > 0 && (
            <button className="primary" onClick={save}>
              <Plus size={16} />
              Save as opportunity
            </button>
          )}
        </div>
      )}
    </section>
  );
}
