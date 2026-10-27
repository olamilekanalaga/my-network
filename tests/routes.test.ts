import test from "node:test";
import assert from "node:assert/strict";
import { GET, POST, DELETE } from "../app/api/data/[table]/route";
import { POST as assistant } from "../app/api/assistant/route";
import { POST as google } from "../app/api/google-contacts/route";
import { POST as enrich } from "../app/api/enrich/route";
import { boundedJson } from "../lib/server";
test("private API routes reject requests without authentication before using external services", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  const ctx = { params: Promise.resolve({ table: "people" }) };
  for (const handler of [GET, POST, DELETE]) {
    const r = await handler(
      new Request("http://localhost/api/data/people"),
      ctx,
    );
    assert.equal(r.status, 401);
  }
  for (const handler of [assistant, google, enrich]) {
    const r = await handler(
      new Request("http://localhost/api/test", { method: "POST", body: "{}" }),
    );
    assert.equal(r.status, 401);
  }
});
test("unknown tables never become dynamic arbitrary SQL access", async () => {
  const r = await GET(new Request("http://localhost/api/data/auth.users"), {
    params: Promise.resolve({ table: "auth.users" }),
  });
  assert.equal(r.status, 404);
});
test("request boundaries reject oversized and malformed JSON", async () => {
  await assert.rejects(() =>
    boundedJson(
      new Request("http://localhost", { method: "POST", body: "bad" }),
    ),
  );
  await assert.rejects(() =>
    boundedJson(
      new Request("http://localhost", {
        method: "POST",
        body: "x".repeat(100),
      }),
      50,
    ),
  );
});
