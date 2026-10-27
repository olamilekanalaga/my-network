"use client";
import { useState, useEffect } from "react";
import {
  Home,
  Users,
  Waypoints,
  BriefcaseBusiness,
  Settings,
  Search,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Upload,
  ShieldCheck,
  Sparkles,
  Bell,
  ChevronRight,
  Building2,
  CalendarDays,
  Globe,
  Trash2,
  Download,
  Check,
  Network,
  Mail,
  LogOut,
  PanelTop,
  CheckCircle2,
  MoreHorizontal,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { useStore, download } from "@/lib/store";
import { browserDb, configured } from "@/lib/supabase";
import {
  type Person,
  type Organization,
  type Opportunity,
  type Fact,
  type Table,
  blankPerson,
  uid,
  stages,
  categories,
} from "@/lib/types";
import { schemas } from "@/lib/validation";
import { graphPath } from "@/lib/intelligence";
import {
  Modal,
  Field,
  Avatar,
  Badge,
  Empty,
  SectionTitle,
  SafeLink,
  Multi,
} from "./ui";
import { PersonForm, OrganizationForm, OpportunityForm } from "./forms";
import ImportWizard from "./import-wizard";
import Assistant from "./assistant";
import ContextCoach from "./context-coach";
import WalletHome from "./wallet-home";
import {
  inContactLayer,
  questionActivity,
  questionHistory,
  type ContactLayer,
} from "@/lib/wallet";
import NetworkAction from "./network-action";
import { goals } from "@/lib/goals";
import type { SelfProfile } from "@/lib/self-profile";
const nav = [
  { name: "Home", icon: Home },
  { name: "Contacts", icon: Users },
  { name: "Ask My network", icon: MessageCircle },
  { name: "Profile", icon: UserRound },
];
const money = (n: number | null) =>
  n === null
    ? "Not agreed"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(n);
export default function Workspace({
  profile,
  onEditProfile,
  onExit,
}: {
  profile?: SelfProfile;
  onEditProfile?: () => void;
  onExit?: () => void;
}) {
  const store = useStore();
  const [contactLayer, setContactLayer] =
    useState<ContactLayer>("All contacts");
  const [questionRequest, setQuestionRequest] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [showFollowups, setShowFollowups] = useState(false);
  const [nextAction, setNextAction] = useState<{
    person: Person;
    goal: string;
  } | null>(null);
  const goal = profile?.role || "Business developer";
  const focus = goals[goal];
  const { data, mode, busy, error, ready } = store;
  const [tab, setTab] = useState("Home"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All people"),
    [networkFilter, setNetworkFilter] = useState("All"),
    [stage, setStage] = useState("All"),
    [person, setPerson] = useState<string | null>(null),
    [editPerson, setEditPerson] = useState<Person | null>(null),
    [org, setOrg] = useState<string | null>(null),
    [editOrg, setEditOrg] = useState<Organization | false | null>(null),
    [editOpp, setEditOpp] = useState<Opportunity | false | null>(null),
    [importing, setImporting] = useState(false),
    [dialog, setDialog] = useState<
      "relation" | "fact" | "transaction" | "affiliation" | "followup" | null
    >(null),
    [allowAI, setAllowAI] = useState(false),
    [privateNotes, setPrivateNotes] = useState(false),
    [bulk, setBulk] = useState<string[]>([]),
    [pathFrom, setPathFrom] = useState(""),
    [pathTo, setPathTo] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    const selectedView =
      view === "People" ? "Contacts" : view === "Settings" ? "Profile" : view;
    if (
      [...nav.map((n) => n.name), "Network", "Opportunities"].includes(
        selectedView || "",
      )
    )
      setTab(selectedView!);
    setAllowAI(localStorage.getItem("ni-ai-consent") === "true");
    setPrivateNotes(localStorage.getItem("ni-notes-consent") === "true");
  }, []);
  const p = data.people.find((x) => x.id === person),
    o = data.organizations.find((x) => x.id === org);
  const personName = (id: string) =>
    data.people.find((p) => p.id === id)?.name ||
    data.organizations.find((o) => o.id === id)?.name ||
    "Deleted record";
  const visible = data.people
    .filter(
      (p) =>
        inContactLayer(p, contactLayer) &&
        (filter === "All people" ||
          p.categories.includes(
            filter === "Customers" ? "Customer" : filter,
          )) &&
        [
          p.name,
          p.position,
          p.location,
          p.services,
          p.needs,
          p.notes,
          p.skills.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const followups = [
    ...data.activities
      .filter((a) => !a.done)
      .map((a) => ({
        id: a.id,
        text: a.text,
        date: a.date,
        activity: true,
        opp: a.opportunity_id,
      })),
    ...data.opportunities
      .filter(
        (o) => o.follow_up && !["Won", "Lost", "Paused"].includes(o.status),
      )
      .map((o) => ({
        id: o.id,
        text: o.title,
        date: o.follow_up,
        activity: false,
        opp: o.id,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  function saved(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(""), 4000);
  }
  function savePerson(x: Person) {
    store.run(async () => {
      await store.save("people", x);
      setEditPerson(null);
      setPerson(x.id);
      saved("Profile saved");
    });
  }
  function saveOpp(x: Opportunity) {
    store.run(async () => {
      await store.save("opportunities", x);
      setEditOpp(null);
      setTab("Opportunities");
      saved("Opportunity saved");
    });
  }
  function openPerson(id: string) {
    setPerson(id);
    setOrg(null);
  }
  async function connectGoogleContacts() {
    await store.run(async () => {
      const db = browserDb();
      const {
        data: { session },
      } = await db.auth.getSession();
      if (!session)
        throw new Error("Sign in with Google before connecting contacts.");
      const options = {
        scopes: "https://www.googleapis.com/auth/contacts.readonly",
        redirectTo: window.location.origin,
      };
      const result = !session.user.identities?.some(
        (i) => i.provider === "google",
      )
        ? await db.auth.linkIdentity({ provider: "google", options })
        : await db.auth.signInWithOAuth({ provider: "google", options });
      if (result.error) throw result.error;
    });
  }
  function exportData(shareable = false) {
    download(
      shareable
        ? "network-approved-sharing.json"
        : "network-private-backup.json",
      JSON.stringify(
        shareable
          ? {
              facts: data.facts
                .filter(
                  (f) =>
                    f.status === "approved" && f.visibility === "shareable",
                )
                .map((f) => ({
                  person: data.people.find((p) => p.id === f.person_id)?.name,
                  text: f.text,
                  source: f.source_url,
                  date: f.observed_at,
                })),
            }
          : { version: 1, exported_at: new Date().toISOString(), ...data },
        null,
        2,
      ),
    );
    saved(shareable ? "Approved facts exported" : "Private backup exported");
  }
  async function restore(file?: File) {
    if (!file) return;
    store.run(async () => {
      if (file.size > 5_000_000) throw new Error("Backup exceeds 5 MB.");
      const raw = JSON.parse(await file.text());
      if (raw.version !== 1)
        throw new Error("Use a version 1 Network Intelligence backup.");
      for (const t of [
        "people",
        "organizations",
        "affiliations",
        "relationships",
        "facts",
        "transactions",
        "opportunities",
        "activities",
      ] as Table[]) {
        if (!Array.isArray(raw[t])) throw new Error(`Missing ${t}`);
        for (const item of raw[t]) {
          const valid = schemas[t].safeParse(item);
          if (!valid.success) throw new Error(`Invalid ${t} backup record.`);
        }
      }
      if (
        !confirm(
          "Restore merges this backup into your current workspace by record ID. Continue?",
        )
      )
        return;
      for (const t of [
        "people",
        "organizations",
        "affiliations",
        "relationships",
        "facts",
        "transactions",
        "opportunities",
        "activities",
      ] as Table[])
        for (const item of raw[t]) await store.save(t, item);
      saved("Backup restored");
    });
  }
  function relatedFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) || "");
    store.run(async () => {
      if (dialog === "relation")
        await store.save("relationships", {
          id: uid(),
          from_id: v("from"),
          to_id: v("to"),
          label: v("label"),
          verification: v("verification") as "Confirmed",
          source: v("source"),
        });
      if (dialog === "affiliation")
        await store.save("affiliations", {
          id: uid(),
          person_id: p!.id,
          organization_id: v("organization"),
          role: v("role"),
        });
      if (dialog === "transaction")
        await store.save("transactions", {
          id: uid(),
          person_id: p!.id,
          description: v("description"),
          amount: Number(v("amount")),
          currency: v("currency"),
          date: v("date"),
          direction: v("direction") as "received",
          notes: v("notes"),
        });
      if (dialog === "fact") {
        const url = v("source_url");
        try {
          if (!["https:", "http:"].includes(new URL(url).protocol))
            throw new Error();
        } catch {
          throw new Error("Add an HTTP or HTTPS source URL.");
        }
        await store.save("facts", {
          id: uid(),
          person_id: p!.id,
          text: v("text"),
          source_url: url,
          observed_at: v("date"),
          confidence: 0.5,
          status: "pending",
          verification: "Publicly observed",
          visibility: "public",
        });
      }
      if (dialog === "followup")
        await store.save("activities", {
          id: uid(),
          person_id: p?.id || null,
          opportunity_id: v("opportunity") || null,
          text: v("text"),
          date: v("date"),
          done: false,
        });
      setDialog(null);
      saved("Record saved");
    });
  }
  if (!ready)
    return (
      <div className="loading">
        <span className="brand-mark">
          <Network />
        </span>
        <h2>Network Intelligence</h2>
        <p>Opening your private workspace…</p>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setTab("Home")}>
          <span className="brand-mark">
            <Network size={23} />
          </span>
          <span>
            Network
            <br />
            <b>your next move.</b>
          </span>
        </a>
        <div className="workspace-label">
          YOUR INNER CIRCLE <ShieldCheck size={12} />
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.name}
              className={
                tab === n.name ||
                (n.name === "Contacts" &&
                  ["Network", "Opportunities"].includes(tab))
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(n.name);
                setSearch("");
              }}
            >
              <n.icon size={19} />
              {n.name}
              {n.name === "Opportunities" && (
                <span className="nav-count">{data.opportunities.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={20} />
          <h4>Less scrolling. More connecting.</h4>
          <p>Your next opportunity might already be in your network.</p>
        </div>
        {onEditProfile && (
          <button className="secondary" onClick={onEditProfile}>
            Edit my profile
          </button>
        )}
        {onExit && (
          <button className="text-link" onClick={onExit}>
            Sign out / leave demo
          </button>
        )}
        <button className="account" onClick={() => setTab("Profile")}>
          <Avatar
            name={profile?.name || store.email || "Your Workspace"}
            photo={profile?.photo}
          />
          <span>
            <strong>
              {mode === "demo"
                ? "Your demo workspace"
                : "Your private workspace"}
            </strong>
            <small>
              {mode === "demo" ? "Fictional data · local only" : store.email}
            </small>
          </span>
          <Settings size={16} />
        </button>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Network size={19} />
            </span>
          </div>
          <div className="breadcrumb">
            Personal workspace <ChevronRight size={13} /> {tab}
          </div>
          <div className="top-actions">
            {onExit && (
              <button
                className="icon mobile-only"
                aria-label="Sign out / leave demo"
                onClick={onExit}
              >
                <LogOut size={18} />
              </button>
            )}
            <button
              className="icon notification"
              aria-label="View follow-ups"
              onClick={() => {
                setShowFollowups(true);
              }}
            >
              <Bell size={19} />
              {followups.length > 0 && <i />}
            </button>
            <Avatar
              name={profile?.name || "Your Workspace"}
              photo={profile?.photo}
            />
          </div>
        </header>
        <main>
          {error && (
            <div className="error banner" role="alert">
              {error}
              <button
                className="icon"
                aria-label="Dismiss error"
                onClick={() => store.setError("")}
              >
                ×
              </button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={16} />
              {notice}
            </div>
          )}
          {busy && (
            <div className="busy" role="status">
              Saving / loading…
            </div>
          )}
          {tab === "Home" && (
            <WalletHome
              localOnly={mode === "demo"}
              name={profile?.name || "there"}
              people={data.people}
              history={questionHistory(data.activities)}
              followups={followups.length}
              onPerson={openPerson}
              onAdd={() => setEditPerson(blankPerson())}
              onImport={() => setImporting(true)}
              onAsk={() => {
                setQuestionRequest(null);
                setTab("Ask My network");
              }}
              onLayer={(layer) => {
                setContactLayer(layer);
                setFilter("All people");
                setSearch("");
                setTab("Contacts");
              }}
              onQuestion={(question) => {
                setQuestionRequest({ id: uid(), question });
                setTab("Ask My network");
              }}
              onFollowups={() => setShowFollowups(true)}
            />
          )}
          <div hidden={tab !== "Ask My network"}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">PUT YOUR CONNECTIONS TO WORK</div>
                <h1>Ask My network</h1>
                <p>Who can help with your next move? Start with a question.</p>
              </div>
            </div>
            <Assistant
              request={questionRequest}
              onAnswered={async (question, answer) => {
                await store.save(
                  "activities",
                  questionActivity(question, answer),
                );
              }}
              onAction={(person, goal) => setNextAction({ person, goal })}
              prompts={
                profile?.goal ? [profile.goal, ...focus.prompts] : focus.prompts
              }
              data={data}
              mode={mode}
              allowAI={allowAI}
              privateNotes={privateNotes}
              onSave={(o) => setEditOpp(o)}
              onPerson={openPerson}
            />
          </div>
          {["Contacts", "Network", "Opportunities"].includes(tab) && (
            <nav className="contact-tools" aria-label="Contact tools">
              {["Contacts", "Network", "Opportunities"].map((item) => (
                <button
                  key={item}
                  aria-pressed={tab === item}
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
          )}
          {tab === "Contacts" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    CONTEXT MAKES CONNECTIONS USEFUL
                  </div>
                  <h1>Your contacts</h1>
                  <p>
                    Customers, collaborators, friends — often more than one.
                  </p>
                </div>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() => setImporting(true)}
                  >
                    <Upload size={16} />
                    Import
                  </button>
                  <button
                    className="primary"
                    onClick={() => setEditPerson(blankPerson())}
                  >
                    <Plus size={16} />
                    Add person
                  </button>
                </div>
              </div>
              <div className="ledger-filters" aria-label="Contact layer">
                {(
                  [
                    "All contacts",
                    "Founders",
                    "Skilled workers",
                    "Needs context",
                  ] as ContactLayer[]
                ).map((layer) => (
                  <button
                    key={layer}
                    aria-pressed={contactLayer === layer}
                    onClick={() => setContactLayer(layer)}
                  >
                    {layer}
                  </button>
                ))}
              </div>
              <div className="toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search people"
                    placeholder="Search people, capabilities or needs…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Category filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "All people",
                    "Customers",
                    ...categories.filter((c) => c !== "Customer"),
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {filter === "Customers" && (
                <p className="notice">
                  Commercial relationships work both ways. Explore what your
                  customers sell, alongside what they purchased from you.
                </p>
              )}
              {bulk.length > 0 && (
                <div className="bulkbar">
                  <b>{bulk.length} selected</b>
                  <select
                    aria-label="Bulk add category"
                    defaultValue=""
                    onChange={(e) => {
                      const c = e.target.value;
                      if (c)
                        store.run(async () => {
                          for (const p of data.people.filter((p) =>
                            bulk.includes(p.id),
                          ))
                            await store.save("people", {
                              ...p,
                              categories: [...new Set([...p.categories, c])],
                              updated_at: new Date().toISOString(),
                            });
                          setBulk([]);
                          saved("Categories updated");
                        });
                      e.target.value = "";
                    }}
                  >
                    <option value="">Add category…</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <button className="text-link" onClick={() => setBulk([])}>
                    Clear
                  </button>
                </div>
              )}
              <div className="people-count">
                {visible.length} people{" "}
                <button
                  className="text-link"
                  onClick={() => setBulk(visible.map((p) => p.id))}
                >
                  Select all shown
                </button>
              </div>
              <div className="contact-grid people-grid">
                {visible.map((p) => (
                  <div className="selectable-card" key={p.id}>
                    <input
                      aria-label={`Select ${p.name}`}
                      type="checkbox"
                      checked={bulk.includes(p.id)}
                      onChange={(e) =>
                        setBulk(
                          e.target.checked
                            ? [...bulk, p.id]
                            : bulk.filter((x) => x !== p.id),
                        )
                      }
                    />
                    <ContactCard person={p} onClick={() => openPerson(p.id)} />
                    {filter === "Customers" && (
                      <div className="customer-extra">
                        <b>Purchased from you</b>
                        {data.transactions
                          .filter(
                            (t) =>
                              t.person_id === p.id &&
                              t.direction === "received",
                          )
                          .map((t) => (
                            <p key={t.id}>
                              {t.description} · {t.currency} {t.amount}
                            </p>
                          ))}
                        {!data.transactions.some(
                          (t) => t.person_id === p.id,
                        ) && <p>No transaction recorded.</p>}
                        <b>They sell</b>
                        <p>{p.services || "Not yet documented"}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!visible.length && (
                <Empty>
                  No matches yet. Add a person or import a contact file.
                </Empty>
              )}
            </>
          )}
          {tab === "Network" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">SEE THE CONNECTIONS BETWEEN</div>
                  <h1>Your wider network</h1>
                  <p>People, organisations and the paths you can verify.</p>
                </div>
                <button className="primary" onClick={() => setEditOrg(false)}>
                  <Plus size={16} />
                  Add record
                </button>
              </div>
              <div className="tabs">
                {["All", "Company", "Community", "Event", "Relationships"].map(
                  (x) => (
                    <button
                      className={networkFilter === x ? "active" : ""}
                      key={x}
                      onClick={() => setNetworkFilter(x)}
                    >
                      {x === "Company"
                        ? "Companies"
                        : x === "Community"
                          ? "Communities"
                          : x === "Event"
                            ? "Events"
                            : x}
                    </button>
                  ),
                )}
              </div>
              {networkFilter !== "Relationships" ? (
                <div className="contact-grid people-grid">
                  {data.organizations
                    .filter(
                      (o) =>
                        networkFilter === "All" || o.kind === networkFilter,
                    )
                    .map((o) => (
                      <button
                        className="org-card panel"
                        key={o.id}
                        onClick={() => setOrg(o.id)}
                      >
                        <span className="org-icon">
                          {o.kind === "Event" ? (
                            <CalendarDays size={23} />
                          ) : o.kind === "Community" ? (
                            <Globe size={23} />
                          ) : (
                            <Building2 size={23} />
                          )}
                        </span>
                        <Badge>{o.kind}</Badge>
                        <h3>{o.name}</h3>
                        <p>{o.description}</p>
                        <div className="small muted">
                          {o.location} {o.event_date && `· ${o.event_date}`}
                        </div>
                        <div className="card-bottom">
                          {
                            data.affiliations.filter(
                              (a) => a.organization_id === o.id,
                            ).length
                          }{" "}
                          people you know <ArrowUpRight size={16} />
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <>
                  <div className="panel">
                    <SectionTitle
                      title="Documented relationships"
                      action={
                        <button
                          className="secondary"
                          onClick={() => setDialog("relation")}
                        >
                          <Plus size={15} />
                          Add relationship
                        </button>
                      }
                    />
                    {data.relationships.map((r) => (
                      <div className="relationship-row" key={r.id}>
                        <div className="path">
                          <b>{personName(r.from_id)}</b>
                          <ArrowRight size={14} />
                          <b>{personName(r.to_id)}</b>
                        </div>
                        <p>
                          {r.label}{" "}
                          <Badge
                            tone={
                              r.verification === "Confirmed" ? "green" : "amber"
                            }
                          >
                            {r.verification}
                          </Badge>
                        </p>
                        <small>{r.source}</small>
                        <button
                          className="icon"
                          aria-label="Delete relationship"
                          onClick={() => {
                            if (confirm("Delete this relationship?"))
                              store.run(() =>
                                store.remove("relationships", r.id),
                              );
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="panel path-finder">
                    <h3>Find a documented introduction path</h3>
                    <div className="form-grid">
                      <Field label="From">
                        <select
                          value={pathFrom}
                          onChange={(e) => setPathFrom(e.target.value)}
                        >
                          <option value="">Choose a record</option>
                          {[...data.people, ...data.organizations].map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="To">
                        <select
                          value={pathTo}
                          onChange={(e) => setPathTo(e.target.value)}
                        >
                          <option value="">Choose a record</option>
                          {[...data.people, ...data.organizations].map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    {pathFrom && pathTo && (
                      <p className="notice">
                        {graphPath(data, pathFrom, pathTo).length
                          ? graphPath(data, pathFrom, pathTo)
                              .map(personName)
                              .join(" → ")
                          : "No confirmed personal path recorded. Shared membership is not proof of access."}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          {tab === "Opportunities" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    TURN POSSIBILITIES INTO CONVERSATIONS
                  </div>
                  <h1>Your opportunities</h1>
                  <p>
                    Track the next step, from a first idea to an agreed outcome.
                  </p>
                </div>
                <button className="primary" onClick={() => setEditOpp(false)}>
                  <Plus size={16} />
                  Add opportunity
                </button>
              </div>
              <div className="tabs pipeline">
                {["All", ...stages].map((x) => (
                  <button
                    key={x}
                    className={stage === x ? "active" : ""}
                    onClick={() => setStage(x)}
                  >
                    {x}{" "}
                    <span>
                      {
                        data.opportunities.filter(
                          (o) => x === "All" || o.status === x,
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </div>
              <div className="contact-grid people-grid">
                {data.opportunities
                  .filter((o) => stage === "All" || o.status === stage)
                  .map((o) => (
                    <article className="panel opportunity-card" key={o.id}>
                      <Badge tone={o.status === "Won" ? "green" : "blue"}>
                        {o.status}
                      </Badge>
                      <button
                        className="card-title"
                        onClick={() => setEditOpp(o)}
                      >
                        <h3>{o.title}</h3>
                        <ArrowUpRight size={17} />
                      </button>
                      <p className="truncate-notes">{o.notes}</p>
                      <div className="opportunity-people">
                        {o.person_ids.map((id) => (
                          <button key={id} onClick={() => openPerson(id)}>
                            <Avatar name={personName(id)} size="tiny" />
                          </button>
                        ))}
                      </div>
                      <div className="money-grid">
                        <span>
                          Deal value<b>{money(o.value)}</b>
                        </span>
                        <span>
                          Agreed fee<b>{money(o.agreed_fee)}</b>
                        </span>
                      </div>
                      <small className="muted">
                        Potential referral fee: {money(o.potential_fee)} ·
                        estimates are not entitlements.
                      </small>
                      <div className="card-bottom">
                        {o.follow_up ? (
                          <span>
                            <CalendarDays size={13} /> {o.follow_up}
                          </span>
                        ) : (
                          <span>No follow-up set</span>
                        )}
                        <button
                          className="text-link"
                          onClick={() => setEditOpp(o)}
                        >
                          Update <ArrowRight size={13} />
                        </button>
                      </div>
                      <button
                        className="icon delete-opp"
                        aria-label="Delete opportunity"
                        onClick={() => {
                          if (confirm("Delete this opportunity?"))
                            store.run(() =>
                              store.remove("opportunities", o.id),
                            );
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </article>
                  ))}
              </div>
              {!data.opportunities.length && (
                <Empty>
                  Ask your network a question, then save a potential match here.
                </Empty>
              )}
            </>
          )}
          {tab === "Profile" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A WORKSPACE YOU CONTROL</div>
                  <h1>Profile & settings</h1>
                  <p>Your data, your permissions, your pace.</p>
                </div>
              </div>
              {profile && (
                <section className="profile-focus">
                  <Avatar
                    name={profile.name}
                    photo={profile.photo}
                    size="large"
                  />
                  <div>
                    <h2>{profile.name}</h2>
                    <p>
                      {profile.role}
                      {profile.location ? ` · ${profile.location}` : ""}
                    </p>
                    {profile.companyName && (
                      <p>
                        <b>{profile.companyName}</b>
                      </p>
                    )}
                    {profile.roleDescription && (
                      <p>{profile.roleDescription}</p>
                    )}
                    <p>{profile.headline}</p>
                    {profile.links.map((link) => (
                      <p key={link}>
                        <SafeLink url={link} />
                      </p>
                    ))}
                    <p>
                      <b>Your next move:</b> {profile.goal}
                    </p>
                    <p>
                      <b>You offer:</b> {profile.offers || "Not added yet"}
                    </p>
                    <p>
                      <b>You need:</b> {profile.needs || "Not added yet"}
                    </p>
                  </div>
                  <button className="secondary" onClick={onEditProfile}>
                    Edit my profile
                  </button>
                </section>
              )}
              <ContextCoach
                people={data.people}
                onEdit={setEditPerson}
                onImport={() => setImporting(true)}
              />
              <div className="settings-grid">
                <section className="panel">
                  <SectionTitle title="Account" />
                  <Badge tone={mode === "demo" ? "amber" : "green"}>
                    {mode === "demo"
                      ? "Demo · this browser only"
                      : "Authenticated · Supabase"}
                  </Badge>
                  <p className="muted">
                    {mode === "demo"
                      ? "Explore with fictional data. Demo storage is not an authenticated private vault."
                      : store.email}
                  </p>
                  {onExit && (
                    <button className="secondary" onClick={onExit}>
                      {mode === "demo" ? "Leave demo to sign in" : "Sign out"}
                    </button>
                  )}
                  <button
                    className="secondary wide"
                    disabled={!configured() || mode !== "live"}
                    onClick={() => void connectGoogleContacts()}
                  >
                    Connect Google with Contacts permission
                  </button>
                  {!configured() && (
                    <p className="small muted">
                      Google account connections are not available yet. You can
                      keep exploring the demo.
                    </p>
                  )}
                </section>
                <section className="panel">
                  <SectionTitle title="AI & privacy" />
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={allowAI}
                      onChange={(e) => {
                        setAllowAI(e.target.checked);
                        localStorage.setItem(
                          "ni-ai-consent",
                          String(e.target.checked),
                        );
                      }}
                    />
                    <span>
                      <strong>Allow AI processing</strong>
                      <small>
                        In connected mode, send retrieved context to OpenAI on
                        each question. No automatic messaging.
                      </small>
                    </span>
                  </label>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={privateNotes}
                      onChange={(e) => {
                        setPrivateNotes(e.target.checked);
                        localStorage.setItem(
                          "ni-notes-consent",
                          String(e.target.checked),
                        );
                      }}
                    />
                    <span>
                      <strong>Include private notes in retrieval</strong>
                      <small>
                        Off by default. Includes conversation notes,
                        transcripts, promises and private approved facts.
                      </small>
                    </span>
                  </label>
                  <p className="notice">
                    Profile capability and need fields may still contain
                    sensitive information. Review them before enabling AI.
                    Public, private and shareable facts remain distinct.
                  </p>
                  <p className="small muted">
                    OpenAI requests use store:false. Provider retention depends
                    on your account terms. No sharing is automatic.
                  </p>
                </section>
                <section className="panel">
                  <SectionTitle title="Imports & backups" />
                  <button
                    className="secondary wide"
                    onClick={() => setImporting(true)}
                  >
                    <Upload size={16} />
                    Import contacts
                  </button>
                  <button
                    className="secondary wide"
                    onClick={() => exportData()}
                  >
                    <Download size={16} />
                    Export full private backup
                  </button>
                  <button
                    className="secondary wide"
                    onClick={() => exportData(true)}
                  >
                    <ShieldCheck size={16} />
                    Export approved sharing facts only
                  </button>
                  <label className="file-button secondary wide">
                    <Upload size={16} />
                    Restore a backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => restore(e.target.files?.[0])}
                    />
                  </label>
                  <p className="small muted">
                    Full backups include private notes and contact details.
                    Sharing exports include only facts you explicitly mark
                    shareable.
                  </p>
                </section>
                <section className="panel">
                  <SectionTitle title="Data management" />
                  <p className="muted">
                    {mode === "demo"
                      ? "Reset restores fictional examples and clears your demo edits."
                      : "Delete removes all records in this account. Export a backup first."}
                  </p>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        confirm(
                          mode === "demo"
                            ? "Reset all demo edits?"
                            : "Permanently delete all your network records?",
                        )
                      )
                        store.run(() => store.reset());
                    }}
                  >
                    <Trash2 size={16} />
                    {mode === "demo"
                      ? "Reset demo workspace"
                      : "Delete all network records"}
                  </button>
                  <p className="small muted">
                    Account deletion is not included. Use Supabase
                    administration after clearing records; see the handoff
                    guide.
                  </p>
                </section>
              </div>
            </>
          )}
        </main>
        <footer className="footer">
          <ShieldCheck size={12} />
          Private by design <span>Network Intelligence · MVP</span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {nav.map((n) => (
          <button
            className={
              tab === n.name ||
              (n.name === "Contacts" &&
                ["Network", "Opportunities"].includes(tab))
                ? "active"
                : ""
            }
            key={n.name}
            onClick={() => {
              setTab(n.name);
              setSearch("");
              window.scrollTo(0, 0);
            }}
          >
            <n.icon size={21} />
            <span>{n.name === "Profile" ? "Profile" : n.name}</span>
          </button>
        ))}
      </nav>
      {showFollowups && (
        <Modal title="Your follow-ups" onClose={() => setShowFollowups(false)}>
          {" "}
          <section className="panel" id="followups">
            <SectionTitle
              title="Keep things moving"
              action={
                <button
                  className="icon"
                  aria-label="Add follow-up"
                  onClick={() => setDialog("followup")}
                >
                  <Plus size={17} />
                </button>
              }
            />
            {followups.slice(0, 5).map((f) => (
              <div className="followup" key={f.id}>
                <button
                  className="check-button"
                  aria-label={`Complete ${f.text}`}
                  onClick={() =>
                    store.run(async () => {
                      if (f.activity) {
                        const a = data.activities.find((a) => a.id === f.id)!;
                        await store.save("activities", {
                          ...a,
                          done: true,
                        });
                      } else {
                        const o = data.opportunities.find(
                          (o) => o.id === f.id,
                        )!;
                        await store.save("opportunities", {
                          ...o,
                          follow_up: "",
                        });
                      }
                    })
                  }
                >
                  <Check size={12} />
                </button>
                <button
                  className="followup-text"
                  onClick={() => {
                    if (f.opp)
                      setEditOpp(
                        data.opportunities.find((o) => o.id === f.opp) || false,
                      );
                  }}
                >
                  <strong>{f.text}</strong>
                  <small>{f.date || "No date set"}</small>
                </button>
              </div>
            ))}
            {!followups.length && <Empty>No pending follow-ups.</Empty>}
          </section>
        </Modal>
      )}
      {p && (
        <Modal title="Relationship profile" onClose={() => setPerson(null)}>
          <div className="profile-head">
            <Avatar name={p.name} photo={p.photo} size="large" />
            <div>
              <h2>{p.name}</h2>
              <p>{p.position}</p>
              <span className="muted small">{p.location}</span>
            </div>
            <button className="secondary push" onClick={() => setEditPerson(p)}>
              Edit
            </button>
          </div>
          <div className="chips">
            {p.categories.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
            <Badge tone={p.verification === "Confirmed" ? "green" : "amber"}>
              {p.verification}
            </Badge>
            <Badge>Strength {p.strength}/5</Badge>
          </div>
          <div className="profile-section">
            <div className="two-col">
              <div>
                <h4>What they need</h4>
                <p>{p.needs || "Not recorded yet"}</p>
              </div>
              <div>
                <h4>What they can offer</h4>
                <p>{p.offers || p.services || "Not recorded yet"}</p>
              </div>
            </div>
            {p.services && (
              <>
                <h4>Products & services they sell</h4>
                <p>{p.services}</p>
              </>
            )}
            {p.building && (
              <>
                <h4>Building</h4>
                <p>{p.building}</p>
              </>
            )}
            {p.resources && (
              <>
                <h4>Resources & access</h4>
                <p>{p.resources}</p>
              </>
            )}
            <div className="chips">
              {p.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
          <div className="profile-section">
            <SectionTitle
              title="Context & contact"
              action={
                <button
                  className="primary"
                  onClick={() => setNextAction({ person: p, goal: "" })}
                >
                  Take action
                </button>
              }
            />
            <p>
              {p.email} {p.phone && `· ${p.phone}`}
            </p>
            <p className="small muted">
              Met: {p.met || "Not recorded"} {p.met_date}
            </p>
            {p.links.map((l) => (
              <div key={l}>
                <SafeLink url={l} />
              </div>
            ))}
            <h4>Private conversation notes</h4>
            <p className="prewrap">{p.notes || "No notes yet."}</p>
            {p.transcript && (
              <>
                <h4>Voice transcript</h4>
                <p className="prewrap">{p.transcript}</p>
              </>
            )}
            {p.promises && (
              <>
                <h4>Promises & agreements</h4>
                <p>{p.promises}</p>
              </>
            )}
            <small className="muted">
              Source: {p.source} · Updated {p.updated_at.slice(0, 10)}
              <br />
              Sharing: {p.consent}
            </small>
          </div>
          <div className="profile-section">
            <SectionTitle
              title="Companies, communities & events"
              action={
                <button
                  className="text-link"
                  onClick={() => setDialog("affiliation")}
                >
                  + Associate
                </button>
              }
            />
            {data.affiliations
              .filter((a) => a.person_id === p.id)
              .map((a) => (
                <div className="association" key={a.id}>
                  <button
                    className="text-link"
                    onClick={() => {
                      setOrg(a.organization_id);
                      setPerson(null);
                    }}
                  >
                    {personName(a.organization_id)} <ArrowUpRight size={13} />
                  </button>
                  <span>{a.role}</span>
                  <button
                    className="icon"
                    aria-label="Remove association"
                    onClick={() =>
                      store.run(() => store.remove("affiliations", a.id))
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>
          <div className="profile-section">
            <SectionTitle
              title="Public information & saved facts"
              action={
                <button className="text-link" onClick={() => setDialog("fact")}>
                  + Review public text
                </button>
              }
            />
            <p className="small muted">
              Paste information from a permitted public source. New facts
              require your approval and do not create introduction rights.
            </p>
            {data.facts
              .filter((f) => f.person_id === p.id)
              .map((f) => (
                <div className="evidence" key={f.id}>
                  <Badge tone={f.status === "pending" ? "amber" : "green"}>
                    {f.status === "pending"
                      ? "Pending approval"
                      : f.verification}
                  </Badge>
                  <p>{f.text}</p>
                  {f.source_url && <SafeLink url={f.source_url} />}
                  <small>
                    Observed {f.observed_at} · confidence{" "}
                    {Math.round(f.confidence * 100)}%
                  </small>
                  <div className="actions">
                    {f.status === "pending" && (
                      <button
                        className="secondary"
                        onClick={() =>
                          store.run(() =>
                            store.save("facts", { ...f, status: "approved" }),
                          )
                        }
                      >
                        Approve fact
                      </button>
                    )}
                    <select
                      aria-label="Fact sharing visibility"
                      value={f.visibility}
                      onChange={(e) =>
                        store.run(() =>
                          store.save("facts", {
                            ...f,
                            visibility: e.target.value as Fact["visibility"],
                          }),
                        )
                      }
                    >
                      {["private", "public", "shareable"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <button
                      className="icon"
                      aria-label="Delete fact"
                      onClick={() =>
                        store.run(() => store.remove("facts", f.id))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className="profile-section">
            <SectionTitle
              title="Business in both directions"
              action={
                <button
                  className="text-link"
                  onClick={() => setDialog("transaction")}
                >
                  + Transaction
                </button>
              }
            />
            {data.transactions
              .filter((t) => t.person_id === p.id)
              .map((t) => (
                <div className="transaction" key={t.id}>
                  <div>
                    <strong>{t.description}</strong>
                    <small>
                      {t.date} ·{" "}
                      {t.direction === "received"
                        ? "They paid you"
                        : "You paid them"}
                    </small>
                    <p>{t.notes}</p>
                  </div>
                  <b>
                    {t.currency} {t.amount}
                  </b>
                  <button
                    className="icon"
                    aria-label="Delete transaction"
                    onClick={() =>
                      store.run(() => store.remove("transactions", t.id))
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            <p className="small muted">
              Needs: {p.needs || "Not documented"}
              <br />
              They sell: {p.services || "Not documented"}
            </p>
            {data.opportunities
              .filter((o) => o.person_ids.includes(p.id))
              .map((o) => (
                <button
                  className="person-row wide"
                  key={o.id}
                  onClick={() => setEditOpp(o)}
                >
                  <BriefcaseBusiness size={17} />
                  {o.title}
                  <Badge>{o.status}</Badge>
                </button>
              ))}
          </div>
          <div className="profile-section">
            <SectionTitle
              title="Follow-up history"
              action={
                <button
                  className="text-link"
                  onClick={() => setDialog("followup")}
                >
                  + Follow-up
                </button>
              }
            />
            {data.activities
              .filter((a) => a.person_id === p.id)
              .map((a) => (
                <div className="followup" key={a.id}>
                  <input
                    type="checkbox"
                    aria-label={`Complete ${a.text}`}
                    checked={a.done}
                    onChange={(e) =>
                      store.run(() =>
                        store.save("activities", {
                          ...a,
                          done: e.target.checked,
                        }),
                      )
                    }
                  />
                  <span>
                    {a.text}
                    <small>
                      {a.date} · {a.done ? "Completed" : "Pending"}
                    </small>
                  </span>
                </div>
              ))}
          </div>
          <button
            className="danger"
            onClick={() => {
              if (
                confirm(
                  `Delete ${p.name} and their notes, facts and transactions?`,
                )
              )
                store.run(async () => {
                  await store.remove("people", p.id);
                  setPerson(null);
                });
            }}
          >
            <Trash2 size={15} />
            Delete person
          </button>
        </Modal>
      )}
      {o && (
        <Modal title={o.kind} onClose={() => setOrg(null)}>
          <div className="profile-head">
            <span className="org-icon">
              <Building2 />
            </span>
            <div>
              <h2>{o.name}</h2>
              <p>
                {o.location} · {o.industry}
              </p>
            </div>
          </div>
          <p>{o.description}</p>
          <h4>Capabilities / products / access</h4>
          <p>{o.capabilities || "Not recorded"}</p>
          <h4>Needs</h4>
          <p>{o.needs || "Not recorded"}</p>
          {o.event_date && <p>Event date: {o.event_date}</p>}
          {o.website && <SafeLink url={o.website} />}
          <h4>People you know here</h4>
          {data.affiliations
            .filter((a) => a.organization_id === o.id)
            .map((a) => (
              <button
                className="person-row wide"
                key={a.id}
                onClick={() => openPerson(a.person_id)}
              >
                <Avatar name={personName(a.person_id)} />
                <span>
                  <strong>{personName(a.person_id)}</strong>
                  <small>{a.role}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          <h4>Documented relationships</h4>
          {data.relationships
            .filter((r) => r.from_id === o.id || r.to_id === o.id)
            .map((r) => (
              <p key={r.id}>
                {personName(r.from_id)} → {personName(r.to_id)} · {r.label}{" "}
                <Badge>{r.verification}</Badge>
              </p>
            ))}
          <p className="small muted">{o.notes}</p>
          <div className="actions">
            <button className="secondary" onClick={() => setEditOrg(o)}>
              Edit record
            </button>
            <button
              className="danger"
              onClick={() => {
                if (confirm("Delete this network record and its associations?"))
                  store.run(async () => {
                    await store.remove("organizations", o.id);
                    setOrg(null);
                  });
              }}
            >
              Delete record
            </button>
          </div>
        </Modal>
      )}
      {nextAction && (
        <NetworkAction
          data={data}
          person={nextAction.person}
          goal={nextAction.goal}
          onClose={() => setNextAction(null)}
          onSave={(activity) => store.save("activities", activity)}
        />
      )}
      {editPerson && (
        <PersonForm
          key={editPerson.id}
          person={editPerson}
          busy={busy}
          onSave={savePerson}
          onClose={() => setEditPerson(null)}
        />
      )}
      {editOrg !== null && (
        <OrganizationForm
          organization={editOrg || undefined}
          onClose={() => setEditOrg(null)}
          onSave={(o) =>
            store.run(async () => {
              await store.save("organizations", o);
              setEditOrg(null);
              saved("Network record saved");
            })
          }
        />
      )}
      {editOpp !== null && (
        <OpportunityForm
          key={editOpp ? editOpp.id : "new"}
          opportunity={editOpp || undefined}
          data={data}
          onSave={saveOpp}
          onClose={() => setEditOpp(null)}
        />
      )}
      {importing && (
        <ImportWizard
          people={data.people}
          onSave={(p) => store.save("people", p)}
          onClose={() => setImporting(false)}
          onEnrich={(p) => {
            setImporting(false);
            setEditPerson(p);
          }}
        />
      )}
      {dialog && (
        <Modal
          title={
            {
              relation: "Document a relationship",
              fact: "Review public information",
              transaction: "Record a transaction",
              affiliation: "Associate with your network",
              followup: "Add a follow-up",
            }[dialog]
          }
          onClose={() => setDialog(null)}
        >
          <form onSubmit={relatedFormSubmit}>
            {dialog === "relation" && (
              <>
                <Field label="From">
                  <select required name="from" defaultValue={p?.id}>
                    {[...data.people, ...data.organizations].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="To">
                  <select required name="to">
                    {[...data.people, ...data.organizations].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Relationship / partnership">
                  <input
                    required
                    name="label"
                    placeholder="Knows personally, works with, public partnership…"
                  />
                </Field>
                <Field label="Evidence status">
                  <select name="verification">
                    {["Confirmed", "Publicly observed", "Inferred"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Evidence source">
                  <textarea required name="source" />
                </Field>
                <p className="notice">
                  Public partnerships do not establish personal introduction
                  rights. Only confirmed edges enter path queries.
                </p>
              </>
            )}
            {dialog === "affiliation" && (
              <>
                <Field label="Company, community or event">
                  <select required name="organization">
                    {data.organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Role (owner, employee, attendee, member…) ">
                  <input required name="role" />
                </Field>
              </>
            )}
            {dialog === "fact" && (
              <>
                <p className="muted">
                  Open the source yourself and paste relevant public
                  professional information below. This MVP does not scrape
                  social platforms.
                </p>
                <Field label="Source URL">
                  <input
                    required
                    name="source_url"
                    type="url"
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Public text / fact to review">
                  <textarea required name="text" />
                </Field>
                <Field label="Observed date">
                  <input
                    required
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </Field>
                <p className="notice">
                  Saved as pending, with 50% review confidence. Approval is
                  separate. No AI fact extraction is claimed.
                </p>
              </>
            )}
            {dialog === "transaction" && (
              <>
                <Field label="Product / service purchased">
                  <input required name="description" />
                </Field>
                <div className="form-grid">
                  <Field label="Amount">
                    <input
                      required
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </Field>
                  <Field label="Currency">
                    <select name="currency">
                      {["GBP", "USD", "EUR", "NGN"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Direction">
                  <select name="direction">
                    <option value="received">They paid me</option>
                    <option value="paid">I paid them</option>
                  </select>
                </Field>
                <Field label="Date">
                  <input type="date" name="date" required />
                </Field>
                <Field label="Notes / agreement">
                  <textarea name="notes" />
                </Field>
              </>
            )}
            {dialog === "followup" && (
              <>
                <Field label="Next action">
                  <textarea required name="text" />
                </Field>
                <Field label="Follow-up date">
                  <input name="date" type="date" required />
                </Field>
                <Field label="Related opportunity (optional)">
                  <select name="opportunity">
                    <option value="">No opportunity</option>
                    {data.opportunities.map((o) => (
                      <option value={o.id} key={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            <button className="primary wide" disabled={busy}>
              Save {dialog === "fact" ? "for review" : "record"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function ContactCard({
  person: p,
  onClick,
}: {
  person: Person;
  onClick: () => void;
}) {
  return (
    <button className="contact-card" onClick={onClick}>
      <div className="contact-top">
        <Avatar name={p.name} photo={p.photo} />
        <ArrowUpRight size={16} />
      </div>
      <h3>{p.name}</h3>
      <p className="position">{p.position || "Add a little context"}</p>
      <span className="location">{p.location || "Location not recorded"}</span>
      <div className="contact-need">
        <span>
          {p.services ? "PROVIDES" : p.needs ? "LOOKING FOR" : "NEXT STEP"}
        </span>
        <p>
          {p.services ||
            p.needs ||
            "Add their capabilities, needs and how you met."}
        </p>
      </div>
    </button>
  );
}
