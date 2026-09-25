import { setSellerSession } from "./session";

// export async function GET() {
//   "use server";
//   await setSellerSession("023cdc23-3191-44fb-af54-aaf487a419d3");
//   throw redirect("/seller/products/new");
// }

// Route de TEST uniquement — à supprimer avant toute mise en prod.
export async function GET() {
  await setSellerSession("023cdc23-3191-44fb-af54-aaf487a419d3");
  return new Response(null, {
    status: 302,
    headers: { Location: "/seller/products/new" },
  });
}
