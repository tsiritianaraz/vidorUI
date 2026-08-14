import { json } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return json({ error: "Aucun code retourné par Facebook" }, { status: 400 });
  }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = "http://localhost:3000/api/auth/facebook/callback";

  // 1. Échanger le code contre un user access token
  const tokenUrl = new URL("https://graph.facebook.com/v25.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return json({ error: tokenData.error }, { status: 400 });
  }

  const userAccessToken = tokenData.access_token;

  // 2. Récupérer les Pages administrées par l'utilisateur
  const pagesRes = await fetch(`https://graph.facebook.com/v25.0/me/accounts?access_token=${userAccessToken}`);
  const pagesData = await pagesRes.json();

  // pagesData.data = liste de { id, name, access_token (Page token), ... }
  return json(pagesData);
}
