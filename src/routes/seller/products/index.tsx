import { A, action, createAsync, query } from "@solidjs/router";
import { For, Show } from "solid-js";
import { formatPrice } from "~/lib/format";
import { listProductsForSeller, toggleProductStatus } from "~/server/products";
import { getSellerIdFromSession } from "~/server/session";

const getMyProductsQuery = query(async () => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  return listProductsForSeller(sellerId);
}, "my-products");

const toggleProductStatusAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  await toggleProductStatus(sellerId, String(formData.get("productId")));
}, "toggleProductStatus");

export const route = {
  preload: () => getMyProductsQuery(),
};

const STOCK_LABELS: Record<string, string> = {
  in_stock: "Disponible",
  out_of_stock: "Rupture de stock",
};

export default function MyProductsPage() {
  const products = createAsync(() => getMyProductsQuery());

  return (
    <main class="max-w-2xl mx-auto p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-semibold">Mes produits</h1>
        <A href="/seller/products/new" class="bg-black text-white rounded px-4 py-2 text-sm">
          + Nouveau produit
        </A>
      </div>

      <Show when={products() && products()!.length > 0} fallback={<p class="text-sm text-gray-500">Aucun produit publié pour l'instant.</p>}>
        <ul class="space-y-3">
          <For each={products()}>
            {(product) => (
              <li class="flex items-center gap-3 border rounded-lg p-3">
                <Show when={product.photos[0]}>{(photo) => <img src={photo().url} alt={product.name} class="w-16 h-16 object-cover rounded" />}</Show>

                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm truncate">{product.name}</p>
                  <p class="text-sm text-gray-600">
                    {formatPrice(product.price)}
                    <Show when={product.size}> — Taille {product.size}</Show>
                  </p>
                  <p class="text-xs text-gray-400">
                    {product.category.name} · {STOCK_LABELS[product.stockStatus]}
                  </p>
                </div>

                <span
                  class={`text-xs px-2 py-0.5 rounded-full ${
                    product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {product.status === "active" ? "Actif" : "Inactif"}
                </span>

                <div class="flex flex-col gap-1 shrink-0">
                  <A href={`/seller/products/${product.id}/edit`} class="text-xs text-blue-600 text-center">
                    Modifier
                  </A>
                  <form action={toggleProductStatusAction} method="post">
                    <input type="hidden" name="productId" value={product.id} />
                    <button type="submit" class="text-xs text-red-600">
                      {product.status === "active" ? "Désactiver" : "Réactiver"}
                    </button>
                  </form>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </main>
  );
}
