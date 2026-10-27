"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Network, ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { browserDb, configured } from "@/lib/supabase";
import { goals, type Goal } from "@/lib/goals";
import {
  blankSelfProfile,
  demoProfileKey,
  entryModeKey,
  readSelfProfile,
  selfProfileSchema,
  type SelfProfile,
} from "@/lib/self-profile";
import { Field } from "./ui";
import Workspace from "./workspace";

type Screen = "signin" | "onboarding" | "workspace";
export default function EntryFlow({ screen }: { screen: Screen }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"demo" | "live" | null>(null);
  const [profile, setProfile] = useState<SelfProfile>(blankSelfProfile);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const query = new URLSearchParams(window.location.search);
        if (params.get("error_description") || query.get("error_description"))
          throw new Error(
            params.get("error_description") || query.get("error_description")!,
          );
        let selected: "demo" | "live" | null = null;
        let saved: SelfProfile | null = null;
        let initial = blankSelfProfile();
        if (localStorage.getItem(entryModeKey) === "demo") {
          selected = "demo";
          try {
            saved = readSelfProfile(
              JSON.parse(localStorage.getItem(demoProfileKey) || "null"),
            );
          } catch {
            /* A malformed profile returns to setup without touching contacts. */
          }
        } else if (configured()) {
          const { data, error } = await browserDb().auth.getSession();
          if (error) throw error;
          if (data.session) {
            selected = "live";
            saved = readSelfProfile(
              data.session.user.user_metadata?.network_profile,
            );
            initial.name =
              data.session.user.user_metadata?.full_name ||
              data.session.user.user_metadata?.name ||
              "";
          }
        }
        if (!active) return;
        setMode(selected);
        setProfile(saved || initial);
        if (!selected && screen !== "signin") {
          router.replace("/");
          return;
        }
        if (selected && screen === "signin") {
          router.replace(saved ? "/workspace" : "/onboarding");
          return;
        }
        if (selected && !saved && screen === "workspace") {
          router.replace("/onboarding");
          return;
        }
        setReady(true);
      } catch (e) {
        if (active) {
          setError((e as Error).message);
          setReady(true);
        }
      }
    }
    void init();
    const listener = configured()
      ? browserDb().auth.onAuthStateChange((event) => {
          if (
            event === "SIGNED_OUT" &&
            localStorage.getItem(entryModeKey) !== "demo"
          ) {
            setMode(null);
            router.replace("/");
          }
        }).data.subscription
      : null;
    return () => {
      active = false;
      listener?.unsubscribe();
    };
  }, [router, screen]);
  async function google() {
    setBusy(true);
    setError("");
    try {
      if (!configured())
        throw new Error(
          "Google sign-in is not connected yet. You can explore the demo now.",
        );
      localStorage.removeItem(entryModeKey);
      const { error } = await browserDb().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  function demo() {
    try {
      localStorage.setItem(entryModeKey, "demo");
      router.push("/onboarding");
    } catch {
      setError(
        "Browser storage is unavailable. Enable storage to use the demo.",
      );
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const parsed = selfProfileSchema.safeParse(profile);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (mode === "demo")
        localStorage.setItem(demoProfileKey, JSON.stringify(parsed.data));
      else if (mode === "live") {
        const { error } = await browserDb().auth.updateUser({
          data: { network_profile: parsed.data },
        });
        if (error) throw error;
      } else throw new Error("Choose Google sign-in or demo first.");
      router.push("/workspace");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exit() {
    setError("");
    try {
      if (mode === "live") {
        const { error } = await browserDb().auth.signOut();
        if (error) throw error;
      }
      localStorage.removeItem(entryModeKey);
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const set = (key: keyof SelfProfile, value: string) =>
    setProfile((p) => ({ ...p, [key]: value }));
  if (!ready)
    return (
      <div className="loading" role="status">
        Opening your space…
      </div>
    );
  if (screen === "workspace" && mode && readSelfProfile(profile))
    return (
      <>
        {error && (
          <p role="alert" className="error banner">
            {error}
          </p>
        )}
        <Workspace
          profile={profile}
          onEditProfile={() => router.push("/onboarding")}
          onExit={() => void exit()}
        />
      </>
    );
  const focus = goals[profile.role];
  return (
    <div className="entry-shell">
      <header className="entry-header">
        <a className="brand" href="/" aria-label="Network home">
          <span className="brand-mark">
            <Network size={24} />
          </span>
          <span>
            Network
            <br />
            <b>your next move.</b>
          </span>
        </a>
        <span className="entry-step">
          {screen === "signin"
            ? "Your people. Your possibilities."
            : "01 Your profile → 02 Your network"}
        </span>
      </header>
      <main className="entry-main">
        <div className="eyebrow">REAL PEOPLE. REAL POSSIBILITIES.</div>
        <h1>
          {screen === "signin"
            ? "Your next deal starts with a hello."
            : focus.title}
        </h1>
        <p className="entry-intro">
          {screen === "signin"
            ? "Find partners, build warm introductions, and keep your pipeline moving."
            : focus.detail}
        </p>
        {error && (
          <p className="error banner" role="alert">
            {error}
          </p>
        )}
        {screen === "signin" ? (
          <section className="entry-signin" aria-label="Get started">
            <h2>Good connections start here.</h2>
            <p>A space for your relationships, ideas, and next big move.</p>
            <button
              className="primary wide"
              disabled={busy}
              onClick={() => void google()}
            >
              <span className="google-letter" aria-hidden="true">
                G
              </span>
              {busy ? "Connecting…" : "Sign in with Google"}
              <ArrowRight size={18} />
            </button>
            <button className="secondary wide" disabled={busy} onClick={demo}>
              Try the demo
              <ArrowUpRight size={18} />
            </button>
            <p className="small">
              Demo uses fictional contacts and saves your changes in this
              browser. Google connects your private account when configured.
            </p>
            <div className="entry-privacy">
              <ShieldCheck size={17} />
              <span>Your network stays private. You choose what to share.</span>
            </div>
          </section>
        ) : mode ? (
          <form onSubmit={save}>
            <section
              className="goal-panel"
              aria-label="Personalize your workspace"
            >
              <div className="goal-label">
                I’m here as a <span>Make this space yours</span>
              </div>
              <div className="goal-options">
                {(Object.keys(goals) as Goal[]).map((role) => (
                  <button
                    type="button"
                    key={role}
                    aria-pressed={profile.role === role}
                    onClick={() => set("role", role)}
                  >
                    {role}
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
              <div className="goal-next">
                <span>Small steps. Big connections.</span>
                <span>
                  {mode === "demo"
                    ? "Demo · saved on this browser"
                    : "Your private profile"}
                </span>
              </div>
            </section>
            <section className="self-profile">
              <div className="eyebrow">FIRST, LET’S MEET YOU</div>
              <h2>Your profile. Your starting point.</h2>
              <p>
                This is about you—not a contact you’re adding. Keep it simple;
                you can edit it later.
              </p>
              <div className="form-grid">
                <Field label="Your name">
                  <input
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={profile.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </Field>
                <Field label="What do you do? (optional)">
                  <input
                    autoComplete="organization-title"
                    maxLength={150}
                    placeholder="Founder, designer, talent partner…"
                    value={profile.headline}
                    onChange={(e) => set("headline", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Where are you based? (optional)">
                <input
                  autoComplete="address-level2"
                  maxLength={120}
                  placeholder="City or region"
                  value={profile.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </Field>
              <Field label="What can you offer? (optional)">
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Skills, services, experience, or a little of everything"
                  value={profile.offers}
                  onChange={(e) => set("offers", e.target.value)}
                />
              </Field>
              <Field label="What do you need? (optional)">
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="A collaborator, customers, your next role…"
                  value={profile.needs}
                  onChange={(e) => set("needs", e.target.value)}
                />
              </Field>
              <Field label="What’s your next move?">
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  placeholder="I want to find my first three clients…"
                  value={profile.goal}
                  onChange={(e) => set("goal", e.target.value)}
                />
              </Field>
              <button className="primary wide" disabled={busy}>
                {busy ? "Saving your profile…" : "Let’s build my network"}
                <ArrowRight size={18} />
              </button>
              <p className="small">
                {mode === "demo"
                  ? "Your demo profile stays in this browser. Use fictional information to explore."
                  : "Saved privately to your account. This does not create a public listing."}
              </p>
            </section>
          </form>
        ) : (
          <a className="primary" href="/">
            Back to sign-in
          </a>
        )}
        {screen !== "signin" && (
          <button className="text-link entry-back" onClick={() => void exit()}>
            Back to sign-in
          </button>
        )}
      </main>
      <footer className="entry-footer">
        Made for real connections. Built around you.
      </footer>
    </div>
  );
}
