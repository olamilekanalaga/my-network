import { createClient } from "@supabase/supabase-js";
import { configured } from "./supabase";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function authorize(req: Request) {
  if (!configured()) throw new HttpError(503, "Supabase is not configured.");
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new HttpError(401, "Sign in to access private data.");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Session expired. Sign in again.");
  return { db, user: data.user };
}
export function failure(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof HttpError
          ? e.message
          : "Request could not be completed. Check configuration and retry.",
    },
    { status: e instanceof HttpError ? e.status : 500 },
  );
}
export async function boundedJson(req: Request, max = 1_000_000) {
  const raw = await req.text();
  if (raw.length > max) throw new HttpError(413, "Request too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
