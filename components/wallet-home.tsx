"use client";
import { useState } from "react";
import {
  Plus,
  Upload,
  ArrowUpRight,
  MessageCircle,
  ChevronRight,
  Users,
  BriefcaseBusiness,
  Wrench,
  ScanLine,
} from "lucide-react";
import type { Person } from "@/lib/types";
import {
  contactCounts,
  inContactLayer,
  type ContactLayer,
  type QuestionHistory,
} from "@/lib/wallet";
import { Avatar, Empty } from "./ui";
export default function WalletHome({
  name,
  localOnly,
  people,
  history,
  followups,
  onPerson,
  onAdd,
  onImport,
  onAsk,
  onLayer,
  onQuestion,
  onFollowups,
}: {
  name: string;
  localOnly: boolean;
  people: Person[];
  history: QuestionHistory[];
  followups: number;
  onPerson: (id: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onAsk: () => void;
  onLayer: (layer: ContactLayer) => void;
  onQuestion: (question: string) => void;
  onFollowups: () => void;
}) {
  const [list, setList] = useState<"contacts" | "questions">("contacts");
  const [layer, setLayer] = useState<ContactLayer>("All contacts");
  const counts = contactCounts(people);
  const layers: ContactLayer[] = [
    "All contacts",
    "Founders",
    "Skilled workers",
    "Needs context",
  ];
  const visible = people
    .filter((p) => inContactLayer(p, layer))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="wallet-home">
      <div className="wallet-greeting">
        <div>
          <div className="eyebrow">YOUR PEOPLE. YOUR POSSIBILITIES.</div>
          <h1>
            Hey, {name.split(" ")[0] || "there"}
            <span className="greeting-dot">.</span>
          </h1>
          <p>Your network, all in one place.</p>
        </div>
        <Avatar name={name} size="large" />
      </div>
      <section className="network-balance" aria-label="Network overview">
        <div className="balance-top">
          <span>
            <Users size={16} />
            Your network
          </span>
          <span className="balance-status">
            <i />
            {localOnly ? "Demo · this browser" : "Private workspace"}
          </span>
        </div>
        <button
          className="balance-total"
          onClick={() => onLayer("All contacts")}
        >
          <strong>{counts.total.toLocaleString()}</strong>
          <span>
            contacts
            <ArrowUpRight size={19} />
          </span>
        </button>
        <div className="balance-bottom">
          <span>Real connections. More possibilities.</span>
          <button onClick={onFollowups}>
            {followups} follow-ups
            <ChevronRight size={14} />
          </button>
        </div>
      </section>
      <div className="wallet-layers" aria-label="Contact breakdown">
        {[
          {
            label: "Founders" as ContactLayer,
            count: counts.founders,
            icon: BriefcaseBusiness,
            detail: "Labeled Founder",
          },
          {
            label: "Skilled workers" as ContactLayer,
            count: counts.skilled,
            icon: Wrench,
            detail: "Saved skills or label",
          },
          {
            label: "Needs context" as ContactLayer,
            count: counts.incomplete,
            icon: ScanLine,
            detail: "Get to know them better",
          },
        ].map((item) => (
          <button key={item.label} onClick={() => onLayer(item.label)}>
            <item.icon size={17} />
            <strong>{item.count}</strong>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </button>
        ))}
      </div>
      <div className="wallet-actions" aria-label="Network quick actions">
        <button onClick={onAdd}>
          <span>
            <Plus size={25} />
          </span>
          Add contact
        </button>
        <button onClick={onImport}>
          <span>
            <Upload size={23} />
          </span>
          Import
        </button>
        <button onClick={onAsk}>
          <span className="ask-action">
            <MessageCircle size={24} />
          </span>
          Ask my network
        </button>
      </div>
      <section
        className="wallet-ledger"
        aria-label="Your contacts and questions"
      >
        <div className="ledger-tabs" role="tablist" aria-label="Home activity">
          <button
            role="tab"
            aria-selected={list === "contacts"}
            onClick={() => setList("contacts")}
          >
            Contacts<span>{counts.total}</span>
          </button>
          <button
            role="tab"
            aria-selected={list === "questions"}
            onClick={() => setList("questions")}
          >
            Questions<span>{history.length}</span>
          </button>
        </div>
        {list === "contacts" ? (
          <div role="tabpanel" aria-label="Contacts">
            <div className="ledger-filters">
              {layers.map((item) => (
                <button
                  key={item}
                  aria-pressed={layer === item}
                  onClick={() => setLayer(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="ledger-caption">
              Your connections · categories can overlap
            </p>
            <div className="asset-list">
              {visible.map((p) => (
                <button
                  className="asset-row"
                  key={p.id}
                  onClick={() => onPerson(p.id)}
                >
                  <Avatar name={p.name} />
                  <span className="asset-person">
                    <strong>{p.name}</strong>
                    <small>
                      {p.position ||
                        p.skills.filter(Boolean).slice(0, 2).join(" · ") ||
                        "Add what they do"}
                    </small>
                  </span>
                  <span className="asset-label">
                    {p.categories.includes("Founder")
                      ? "Founder"
                      : inContactLayer(p, "Skilled workers")
                        ? "Skilled"
                        : p.categories[0] || "Contact"}
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
            {!visible.length && (
              <Empty>
                No contacts here yet. Add someone or import your address book.
              </Empty>
            )}
          </div>
        ) : (
          <div role="tabpanel" aria-label="Questions">
            <p className="ledger-caption">
              Your question history · tap to ask again with current records
            </p>
            {history.map((item) => (
              <button
                className="question-row"
                key={item.id}
                onClick={() => onQuestion(item.question)}
              >
                <span className="question-symbol">
                  <MessageCircle size={19} />
                </span>
                <span className="asset-person">
                  <strong>{item.question}</strong>
                  <small>
                    {new Date(item.askedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </small>
                </span>
                <span className="question-matches">
                  {item.matches}
                  <small>matches</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
            {!history.length && (
              <div className="wallet-empty">
                <MessageCircle size={27} />
                <h3>Your next question starts something.</h3>
                <p>Ask who can help. Your questions will appear here.</p>
                <button className="primary" onClick={onAsk}>
                  Ask my network
                  <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
