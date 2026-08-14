import { json } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId");
  const pageAccessToken = url.searchParams.get("token");

  if (!pageId || !pageAccessToken) {
    return json({ error: "pageId et token requis en query params" }, { status: 400 });
  }

  const postUrl = `https://graph.facebook.com/v25.0/${pageId}/feed`;

  const res = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Test de publication depuis Vidor 🚀",
      access_token: pageAccessToken,
    }),
  });

  const data = await res.json();
  return json(data);
}
