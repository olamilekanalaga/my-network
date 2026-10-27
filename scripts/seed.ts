import { createClient } from "@supabase/supabase-js";
import { demoData } from "../lib/demo";
import { tables } from "../lib/types";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key || !process.env.SEED_EMAIL || !process.env.SEED_PASSWORD)
  throw new Error(
    "Set Supabase URL / anon key and SEED_EMAIL / SEED_PASSWORD in .env.local. Use a disposable demo account.",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const { data: session, error } = await db.auth.signInWithPassword({
  email: process.env.SEED_EMAIL,
  password: process.env.SEED_PASSWORD,
});
if (error || !session.user) throw error || new Error("Could not sign in.");
const data = demoData();
for (const table of tables) {
  const { error } = await db
    .from(table)
    .upsert(
      data[table].map((item) => ({ ...item, owner_id: session.user!.id })),
    );
  if (error) throw new Error(`${table}: ${error.message}`);
}
console.log(
  "Seeded fictional records for the signed-in demo account. No service key used.",
);
await db.auth.signOut();
