import { redirect } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = "http://localhost:3000/api/auth/facebook/callback";
  const scope = "pages_show_list,pages_read_engagement,pages_manage_posts";

  const authUrl = new URL("https://www.facebook.com/v25.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("response_type", "code");

  return redirect(authUrl.toString());
}
