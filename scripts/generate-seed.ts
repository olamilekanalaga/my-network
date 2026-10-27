import { writeFileSync } from "node:fs";
import { demoData } from "../lib/demo";
import { tables } from "../lib/types";
const data = demoData();
writeFileSync(
  "supabase/demo.seed.json",
  JSON.stringify({ version: 1, ...data }, null, 2) + "\n",
);
let sql = `-- Fictional seed data. Set app.seed_owner to an existing auth.users UUID first.\n-- SQL Editor example: select set_config('app.seed_owner','YOUR_AUTH_USER_UUID',false);\n-- Then run this file. Safe only for a dedicated demonstration account.\nbegin;\n`;
for (const table of tables) {
  const rows = data[table].map((x) => ({ ...x }));
  sql += `insert into public.${table}\nselect (jsonb_populate_record(null::public.${table}, item || jsonb_build_object('owner_id',current_setting('app.seed_owner')::uuid))).*\nfrom jsonb_array_elements($seed$${JSON.stringify(rows)}$seed$::jsonb) item\non conflict (id) do nothing;\n`;
}
sql += "commit;\n";
writeFileSync("supabase/seed.sql", sql);
