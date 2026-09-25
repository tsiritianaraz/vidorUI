import { action, createAsync, query, redirect, useSubmission } from "@solidjs/router";
import { For, Show } from "solid-js";
import { getSellerIdFromSession } from "~/routes/api/dev/session";
import { createProduct, listCategories } from "~/server/products";

const getCategoriesQuery = query(async () => {
  "use server";
  return listCategories();
}, "categories");

const createProductAction = action(async (formData: FormData) => {
  "use server";

  const sellerId = await getSellerIdFromSession();

  const photoFiles = formData.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0);

  await createProduct({
    sellerId,
    categoryId: String(formData.get("categoryId")),
    name: String(formData.get("name")),
    price: Number(formData.get("price")),
    size: formData.get("size") ? String(formData.get("size")) : undefined,
    stockStatus: formData.get("inStock") === "on" ? "in_stock" : "out_of_stock",
    photoFiles,
  });

  throw redirect("/seller/products");
}, "createProduct");

export const route = {
  preload: () => getCategoriesQuery(),
};

export default function NewProductPage() {
  const categories = createAsync(() => getCategoriesQuery());
  const submission = useSubmission(createProductAction);

  return (
    <main class="max-w-xl mx-auto p-6">
      <h1 class="text-xl font-semibold mb-6">Nouveau produit</h1>

      <form action={createProductAction} method="post" enctype="multipart/form-data" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1" for="name">
            Nom du produit
          </label>
          <input id="name" name="name" required class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="price">
            Prix (Ar)
          </label>
          <input id="price" name="price" type="number" min="1" step="1" required class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="categoryId">
            Catégorie
          </label>
          <select id="categoryId" name="categoryId" required class="w-full border rounded px-3 py-2">
            <For each={categories()}>{(category) => <option value={category.id}>{category.name}</option>}</For>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="size">
            Taille (optionnel)
          </label>
          <input id="size" name="size" class="w-full border rounded px-3 py-2" placeholder="ex : M, 42 — laisser vide si non applicable" />
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" name="inStock" id="inStock" checked />
          <label for="inStock">Disponible en stock</label>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" for="photos">
            Photos
          </label>
          <input id="photos" type="file" name="photos" accept="image/*" multiple required />
        </div>

        <Show when={submission.error}>
          <p class="text-red-600 text-sm">{(submission.error as Error).message}</p>
        </Show>

        <button type="submit" disabled={submission.pending} class="bg-black text-white rounded px-4 py-2 disabled:opacity-50">
          {submission.pending ? "Publication..." : "Publier le produit"}
        </button>
      </form>
    </main>
  );
}
