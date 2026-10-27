import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const A = "10000000-0000-4000-8000-000000000001",
  B = "10000000-0000-4000-8000-000000000002",
  P = "20000000-0000-4000-8000-000000000001",
  Q = "20000000-0000-4000-8000-000000000002",
  O = "30000000-0000-4000-8000-000000000001";
test("real PostgreSQL migration: owner RLS, cross-owner links, graph, cleanup and fee constraints", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create role authenticated;create role anon;grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values('${A}'),('${B}');`,
    );
    const sql = readFileSync(
      new URL("../supabase/migrations/001_network.sql", import.meta.url),
      "utf8",
    ).replace("create extension if not exists pgcrypto;", "");
    await db.exec(sql);
    await db.exec(
      `insert into public.people(id,owner_id,name) values('${P}','${A}','Alice'),('${Q}','${B}','Bob');insert into public.organizations(id,owner_id,kind,name) values('${O}','${A}','Company','Print');set role authenticated;select set_config('request.jwt.claim.sub','${A}',false);`,
    );
    assert.equal(
      (await db.query("select * from public.people")).rows.length,
      1,
      "owner A sees only A",
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.people(owner_id,name) values('${B}','Forged')`,
      ),
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.affiliations(owner_id,person_id,organization_id,role) values('${A}','${Q}','${O}','Foreign')`,
      ),
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.relationships(owner_id,from_id,to_id,label,verification) values('${A}','${P}','${Q}','Invalid','Confirmed')`,
      ),
    );
    await db.exec(
      `insert into public.relationships(owner_id,from_id,to_id,label,verification) values('${A}','${P}','${O}','Owns','Confirmed');`,
    );
    assert.equal(
      (
        await db.query(
          `select * from public.relationship_paths('${P}','${O}',4)`,
        )
      ).rows.length,
      1,
    );
    await db.exec(
      `update public.people set name='Should not change' where id='${Q}';delete from public.people where id='${Q}';`,
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.opportunities(owner_id,title,person_ids) values('${A}','Forged link',array['${Q}'::uuid])`,
      ),
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.opportunities(owner_id,title,agreed_fee) values('${A}','Negative',-1)`,
      ),
    );
    await db.exec(
      `insert into public.opportunities(owner_id,title,person_ids,organization_ids) values('${A}','Valid',array['${P}'::uuid],array['${O}'::uuid]);`,
    );
    await db.exec(
      `insert into public.activities(owner_id,person_id,text,done) values('${A}','${P}','Private note · saved',true);`,
    );
    await assert.rejects(() =>
      db.exec(
        `insert into public.activities(owner_id,person_id,text,done) values('${A}','${Q}','Cross-owner note',true);`,
      ),
    );
    assert.equal(
      (await db.query("select * from public.opportunity_people")).rows.length,
      1,
    );
    await db.exec(
      `insert into public.facts(owner_id,person_id,text,confidence,status,verification) values('${A}','${P}','Private',1,'approved','Confirmed');delete from public.people where id='${P}';`,
    );
    assert.equal((await db.query("select * from public.facts")).rows.length, 0);
    assert.equal(
      (await db.query("select * from public.relationships")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.opportunity_people")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query<{ person_id: string | null }>(
          "select person_id from public.activities",
        )
      ).rows[0].person_id,
      null,
      "contact deletion keeps the note without a dangling link",
    );
    await db.exec(`select set_config('request.jwt.claim.sub','${B}',false);`);
    assert.equal(
      (await db.query("select * from public.activities")).rows.length,
      0,
      "other owners cannot read private notes",
    );
    const b = await db.query<{ name: string }>(
      "select name from public.people",
    );
    assert.equal(b.rows[0].name, "Bob", "A cannot change B");
    assert.equal(
      (await db.query("select * from public.opportunities")).rows.length,
      0,
    );
    await db.exec("reset role;set role anon;");
    await assert.rejects(() => db.query("select * from public.people"));
  } finally {
    await db.close();
  }
});
