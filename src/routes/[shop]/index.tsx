import { createAsync, query, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { formatPrice } from "~/lib/format";
import { buildInquiryMessage, buildMessengerLink, buildWhatsAppLink } from "~/lib/shop-links";
import { getShopBySlug } from "~/server/shops";

const getShopQuery = query(async (slug: string) => {
  "use server";
  const shop = await getShopBySlug(slug);

  // Une boutique inexistante ou pas encore vérifiée n'est pas affichée
  // publiquement : elle ne peut de toute façon avoir aucun produit actif.
  if (!shop || !shop.isVerified) {
    throw new Response("Boutique introuvable", { status: 404 });
  }

  return shop;
}, "shop");

export const route = {
  preload: ({ params }: { params: { shop: string } }) => getShopQuery(params.shop),
};

const PROVIDER_LABELS: Record<string, string> = {
  mvola: "MVola",
  orange_money: "Orange Money",
  airtel_money: "Airtel Money",
};

export default function ShopPage() {
  const params = useParams();
  const shop = createAsync(() => getShopQuery(params.shop!));

  return (
    <Show when={shop()}>
      {(shop) => (
        <main class="max-w-3xl mx-auto p-6">
          {/* En-tête boutique */}
          <header class="mb-8">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold">{shop().displayName}</h1>
              <span class="inline-flex items-center gap-1 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">✓ Vendeur Vérifié</span>
            </div>
          </header>

          {/* Moyens de paiement certifiés */}
          <section class="mb-8">
            <h2 class="text-lg font-medium mb-2">Paiement</h2>
            <ul class="space-y-1">
              <For each={shop().paymentAccounts}>
                {(account) => (
                  <li class="text-sm">
                    <span class="font-medium">{PROVIDER_LABELS[account.provider] ?? account.provider}</span> — {account.phoneNumber} (
                    {account.accountHolderName})
                  </li>
                )}
              </For>
            </ul>
          </section>

          {/* Zones de livraison */}
          <section class="mb-8">
            <h2 class="text-lg font-medium mb-2">Livraison</h2>
            <ul class="space-y-1">
              <For each={shop().deliveryZones}>
                {(zone) => (
                  <li class="text-sm">
                    {zone.zone} — {formatPrice(zone.fee)}
                  </li>
                )}
              </For>
            </ul>
          </section>

          {/* Catalogue produits */}
          <section>
            <h2 class="text-lg font-medium mb-4">Produits</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <For each={shop().products}>
                {(product) => {
                  const message = buildInquiryMessage(product);
                  const isAvailable = product.stockStatus === "in_stock";

                  return (
                    <article class="border rounded-lg overflow-hidden">
                      <Show when={product.photos[0]}>
                        {(photo) => <img src={photo().url} alt={product.name} class="w-full aspect-square object-cover" loading="lazy" />}
                      </Show>

                      <div class="p-3">
                        <p class="font-medium text-sm">{product.name}</p>
                        <p class="text-sm text-gray-600">
                          {formatPrice(product.price)}
                          <Show when={product.size}> — Taille {product.size}</Show>
                        </p>

                        <Show when={isAvailable} fallback={<p class="text-xs text-red-600 mt-2">Rupture de stock</p>}>
                          <div class="mt-2 space-y-1">
                            <Show when={shop().whatsappNumber}>
                              {(phone) => (
                                <a
                                  href={buildWhatsAppLink(phone(), message)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="block text-center text-xs bg-green-600 text-white rounded px-2 py-1"
                                >
                                  Acheter via WhatsApp
                                </a>
                              )}
                            </Show>
                            <a
                              href={buildMessengerLink(shop().facebookPageId, message)}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="block text-center text-xs bg-blue-600 text-white rounded px-2 py-1"
                            >
                              Acheter via Messenger
                            </a>
                          </div>
                        </Show>
                      </div>
                    </article>
                  );
                }}
              </For>
            </div>
          </section>
        </main>
      )}
    </Show>
  );
}
