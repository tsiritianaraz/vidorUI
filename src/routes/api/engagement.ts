import { json } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const postId = url.searchParams.get("postId");
  const pageAccessToken = url.searchParams.get("token");

  if (!postId || !pageAccessToken) {
    return json({ error: "postId et token requis" }, { status: 400 });
  }

  const fields = "likes.summary(true),comments.summary(true)";
  const res = await fetch(`https://graph.facebook.com/v25.0/${postId}?fields=${fields}&access_token=${pageAccessToken}`);
  const data = await res.json();
  return json(data);
}
