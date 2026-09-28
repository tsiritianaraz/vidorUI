import {
  action,
  query,
  createAsync,
  redirect,
  useParams,
  useSubmission,
} from "@solidjs/router";
import { For, Show } from "solid-js";
import { getProductForEdit, updateProduct, listCategories } from "~/server/products";
import { getSellerIdFromSession } from "~/server/session";

const getEditDataQuery = query(async (productId: string) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  const [product, categories] = await Promise.all([
    getProductForEdit(sellerId, productId),
    listCategories(),
  ]);

  if (!product) {
    throw new Response("Produit introuvable", { status: 404 });
  }

  return { product, categories };
}, "edit-product");

const updateProductAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  const productId = String(formData.get("productId"));

  const newPhotoFiles = formData
    .getAll("newPhotos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const removePhotoIds = formData.getAll("removePhotoIds").map(String);

  await updateProduct(sellerId, productId, {
    categoryId: String(formData.get("categoryId")),
    name: String(formData.get("name")),
    price: Number(formData.get("price")),
    size: formData.get("size") ? String(formData.get("size")) : undefined,
    stockStatus:
      formData.get("inStock") === "on" ? "in_stock" : "out_of_stock",
    newPhotoFiles,
    removePhotoIds,
  });

  throw redirect("/seller/products");
}, "updateProduct");

export const route = {
  preload: ({ params }: { params: { id: string } }) =>
    getEditDataQuery(params.id),
};

export default function EditProductPage() {
  const params = useParams();
  const data = createAsync(() => getEditDataQuery(params.id));
  const submission = useSubmission(updateProductAction);

  return (
    <Show when={data()}>
      {(data) => (
        <main class="max-w-xl mx-auto p-6">
          <h1 class="text-xl font-semibold mb-6">Modifier le produit</h1>

          <form
            action={updateProductAction}
            method="post"
            encType="multipart/form-data"
            class="space-y-4"
          >
            <input type="hidden" name="productId" value={data().product!.id} />

            <div>
              <label class="block text-sm font-medium mb-1" for="name">
                Nom du produit
              </label>
              <input
                id="name"
                name="name"
                required
                value={data().product!.name}
                class="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" for="price">
                Prix (Ar)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="1"
                step="1"
                required
                value={data().product!.price}
                class="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" for="categoryId">
                Catégorie
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                class="w-full border rounded px-3 py-2"
              >
                <For each={data().categories}>
                  {(category) => (
                    <option
                      value={category.id}
                      selected={category.id === data().product!.categoryId}
                    >
                      {category.name}
                    </option>
                  )}
                </For>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" for="size">
                Taille (optionnel)
              </label>
              <input
                id="size"
                name="size"
                value={data().product!.size ?? ""}
                class="w-full border rounded px-3 py-2"
                placeholder="ex : M, 42 — laisser vide si non applicable"
              />
            </div>

            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                name="inStock"
                id="inStock"
                checked={data().product!.stockStatus === "in_stock"}
              />
              <label for="inStock">Disponible en stock</label>
            </div>

            {/* Photos existantes, avec possibilité de suppression */}
            <div>
              <p class="block text-sm font-medium mb-1">Photos actuelles</p>
              <div class="grid grid-cols-3 gap-2">
                <For each={data().product!.photos}>
                  {(photo) => (
                    <label class="relative block">
                      <img
                        src={photo.url}
                        class="w-full aspect-square object-cover rounded"
                      />
                      <span class="absolute bottom-1 right-1 bg-white/90 rounded px-1 text-xs flex items-center gap-1">
                        <input
                          type="checkbox"
                          name="removePhotoIds"
                          value={photo.id}
                        />
                        Supprimer
                      </span>
                    </label>
                  )}
                </For>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1" for="newPhotos">
                Ajouter des photos
              </label>
              <input
                id="newPhotos"
                type="file"
                name="newPhotos"
                accept="image/*"
                multiple
              />
            </div>

            <Show when={submission.error}>
              <p class="text-red-600 text-sm">
                {(submission.error as Error).message}
              </p>
            </Show>

            <button
              type="submit"
              disabled={submission.pending}
              class="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
            >
              {submission.pending ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </form>
        </main>
      )}
    </Show>
  );
}
