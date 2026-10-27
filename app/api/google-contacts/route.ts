import { authorize, boundedJson, failure, HttpError } from "@/lib/server";
export async function POST(req: Request) {
  try {
    await authorize(req);
    const { providerToken } = await boundedJson(req, 10000);
    if (typeof providerToken !== "string")
      throw new HttpError(
        400,
        "Connect Google with Contacts permission first.",
      );
    let next = "";
    const people: unknown[] = [];
    do {
      const query = new URLSearchParams({
        personFields: "names,emailAddresses,phoneNumbers,organizations",
        pageSize: "1000",
        ...(next ? { pageToken: next } : {}),
      });
      const r = await fetch(
        `https://people.googleapis.com/v1/people/me/connections?${query}`,
        {
          headers: { Authorization: `Bearer ${providerToken}` },
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!r.ok)
        throw new HttpError(
          502,
          "Google Contacts permission missing or expired. Reconnect Google.",
        );
      const data = await r.json();
      people.push(...(data.connections || []));
      next = data.nextPageToken || "";
      if (people.length > 10000)
        throw new HttpError(
          413,
          "Use a CSV export for more than 10,000 Google contacts.",
        );
    } while (next);
    return Response.json(people, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}
