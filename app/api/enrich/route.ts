import { authorize, boundedJson, failure, HttpError } from "@/lib/server";
// Deliberately receives user-reviewed public text; never fetches arbitrary URLs (SSRF/scraping).
export async function POST(req: Request) {
  try {
    await authorize(req);
    const body = await boundedJson(req, 25000);
    if (typeof body.text !== "string" || !body.text.trim())
      throw new HttpError(
        400,
        "Paste public professional information to review.",
      );
    const url = new URL(body.source_url);
    if (!["http:", "https:"].includes(url.protocol))
      throw new HttpError(400, "Use a public HTTP or HTTPS source URL.");
    return Response.json({
      draft: body.text.slice(0, 20000),
      source_url: url.href,
      confidence: 0.5,
      status: "pending",
      verification: "Publicly observed",
    });
  } catch (e) {
    return failure(e);
  }
}
