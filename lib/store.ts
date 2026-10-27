"use client";
import { useEffect, useState, useCallback } from "react";
import { browserDb, configured } from "./supabase";
import { demoData } from "./demo";
import { emptyData, tables, type Data, type Table } from "./types";
import { schemas } from "./validation";
import { deletePerson } from "./import";
import { entryModeKey } from "./self-profile";
const key = "network-intelligence-demo-v1";
export function useStore() {
  const [data, setData] = useState<Data>(emptyData);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (live: boolean) => {
    setBusy(true);
    try {
      if (live) {
        const db = browserDb();
        const {
          data: { session },
        } = await db.auth.getSession();
        if (!session) throw new Error("Sign in first.");
        const rows = await Promise.all(
          tables.map(async (table) => {
            const r = await fetch(`/api/data/${table}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const body = await r.json();
            if (!r.ok) throw new Error(body.error);
            return [table, body];
          }),
        );
        setData(Object.fromEntries(rows) as unknown as Data);
        setMode("live");
        setEmail(session.user.email || "");
      } else {
        const stored = localStorage.getItem(key);
        let initial = demoData();
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (tables.every((t) => Array.isArray(parsed[t]))) initial = parsed;
          } catch {
            setError(
              "Saved demo data could not be read; a fresh fictional demo was loaded.",
            );
          }
        }
        setData(initial);
        setMode("demo");
        setEmail("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        if (localStorage.getItem(entryModeKey) === "demo" || !configured()) {
          if (active) await load(false);
          return;
        }
        const { data, error } = await browserDb().auth.getSession();
        if (error) throw error;
        if (active) await load(Boolean(data.session));
      } catch (e) {
        if (active) {
          setError((e as Error).message);
          setReady(true);
        }
      }
    }
    void initialize();
    const subscription = configured()
      ? browserDb().auth.onAuthStateChange((event, session) => {
          if (localStorage.getItem(entryModeKey) === "demo") return;
          if (event === "SIGNED_IN" && session)
            setTimeout(() => {
              if (active) void load(true);
            }, 0);
          if (event === "SIGNED_OUT" && active) void load(false);
        }).data.subscription
      : null;
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [load]);
  useEffect(() => {
    if (ready && mode === "demo")
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        setError("Browser storage is full. Export a backup before continuing.");
      }
  }, [data, mode, ready]);
  async function request(table: Table, method: string, body: unknown) {
    const {
      data: { session },
    } = await browserDb().auth.getSession();
    if (!session) throw new Error("Your session expired.");
    const r = await fetch(`/api/data/${table}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error);
    return result;
  }
  async function save<T extends Table>(table: T, item: Data[T][number]) {
    const parsed = schemas[table].safeParse(item);
    if (!parsed.success)
      throw new Error(parsed.error.issues.map((x) => x.message).join("; "));
    const saved =
      mode === "live" ? await request(table, "POST", parsed.data) : parsed.data;
    setData((d) => ({
      ...d,
      [table]: [...d[table].filter((x) => x.id !== item.id), saved],
    }));
    return saved;
  }
  async function remove(table: Table, id: string) {
    if (mode === "live") await request(table, "DELETE", { id });
    if (table === "people") setData((d) => deletePerson(d, id));
    else {
      setData((d) =>
        table === "organizations"
          ? {
              ...d,
              organizations: d.organizations.filter((x) => x.id !== id),
              affiliations: d.affiliations.filter(
                (a) => a.organization_id !== id,
              ),
              relationships: d.relationships.filter(
                (r) => r.from_id !== id && r.to_id !== id,
              ),
              opportunities: d.opportunities.map((o) => ({
                ...o,
                organization_ids: o.organization_ids.filter((x) => x !== id),
              })),
            }
          : table === "opportunities"
            ? {
                ...d,
                opportunities: d.opportunities.filter((o) => o.id !== id),
                activities: d.activities.map((a) => ({
                  ...a,
                  opportunity_id:
                    a.opportunity_id === id ? null : a.opportunity_id,
                })),
              }
            : { ...d, [table]: d[table].filter((x) => x.id !== id) },
      );
      if (mode === "live") await load(true);
    }
  }
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    if (mode === "demo") {
      setData(demoData());
      return;
    }
    for (const t of [
      "activities",
      "opportunities",
      "relationships",
      "affiliations",
      "facts",
      "transactions",
      "people",
      "organizations",
    ] as Table[])
      for (const record of data[t])
        await request(t, "DELETE", { id: record.id });
    await load(true);
  }
  return {
    data,
    ready,
    mode,
    email,
    error,
    setError,
    busy,
    save,
    remove,
    run,
    reset,
    load,
  };
}
export function download(
  name: string,
  text: string,
  type = "application/json",
) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
