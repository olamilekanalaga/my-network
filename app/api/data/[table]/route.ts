import { authorize, boundedJson, failure, HttpError } from "@/lib/server";
import { schemas } from "@/lib/validation";
import { tables, type Table } from "@/lib/types";
export const dynamic = "force-dynamic";
function tableOf(s: string): Table {
  if (!tables.includes(s as Table))
    throw new HttpError(404, "Unknown record type.");
  return s as Table;
}
type Ctx = { params: Promise<{ table: string }> };
export async function GET(req: Request, ctx: Ctx) {
  try {
    const table = tableOf((await ctx.params).table);
    const { db, user } = await authorize(req);
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("owner_id", user.id)
      .limit(10000);
    if (error) throw new HttpError(400, error.message);
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Ctx) {
  try {
    const table = tableOf((await ctx.params).table);
    const { db, user } = await authorize(req);
    const result = schemas[table].safeParse(await boundedJson(req));
    if (!result.success)
      throw new HttpError(
        400,
        result.error.issues.map((x) => x.message).join("; "),
      );
    const { data, error } = await db
      .from(table)
      .upsert({ ...result.data, owner_id: user.id }, { onConflict: "id" })
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);
    return Response.json(data);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const table = tableOf((await ctx.params).table);
    const { db, user } = await authorize(req);
    const { id } = await boundedJson(req);
    if (typeof id !== "string") throw new HttpError(400, "Record ID required.");
    const { error } = await db
      .from(table)
      .delete()
      .eq("owner_id", user.id)
      .eq("id", id);
    if (error) throw new HttpError(400, error.message);
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
