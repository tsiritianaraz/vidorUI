import { action, createAsync, query, useSubmission } from "@solidjs/router";
import { For, Show } from "solid-js";
import { formatPrice } from "~/lib/format";
import { getSellerIdFromSession } from "~/server/session";
import {
  addDeliveryZone,
  addPaymentAccount,
  deleteDeliveryZone,
  deletePaymentAccount,
  getShopSettings,
  updateWhatsAppNumber,
} from "~/server/shop-settings";

const getSettingsQuery = query(async () => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  return getShopSettings(sellerId);
}, "shop-settings");

const updateWhatsAppAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  await updateWhatsAppNumber(sellerId, String(formData.get("whatsappNumber") ?? ""));
}, "updateWhatsApp");

const addPaymentAccountAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  await addPaymentAccount(sellerId, {
    provider: String(formData.get("provider")) as "mvola" | "orange_money" | "airtel_money",
    phoneNumber: String(formData.get("phoneNumber")),
    accountHolderName: String(formData.get("accountHolderName")),
  });
}, "addPaymentAccount");

const deletePaymentAccountAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  await deletePaymentAccount(sellerId, String(formData.get("accountId")));
}, "deletePaymentAccount");

const addDeliveryZoneAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  await addDeliveryZone(sellerId, {
    zone: String(formData.get("zone")),
    fee: Number(formData.get("fee")),
  });
}, "addDeliveryZone");

const deleteDeliveryZoneAction = action(async (formData: FormData) => {
  "use server";
  const sellerId = await getSellerIdFromSession();
  await deleteDeliveryZone(sellerId, String(formData.get("zoneId")));
}, "deleteDeliveryZone");

export const route = {
  preload: () => getSettingsQuery(),
};

const PROVIDER_OPTIONS = [
  { value: "mvola", label: "MVola" },
  { value: "orange_money", label: "Orange Money" },
  { value: "airtel_money", label: "Airtel Money" },
];

export default function ShopSettingsPage() {
  const shop = createAsync(() => getSettingsQuery());
  const whatsappSubmission = useSubmission(updateWhatsAppAction);
  const addAccountSubmission = useSubmission(addPaymentAccountAction);
  const addZoneSubmission = useSubmission(addDeliveryZoneAction);

  return (
    <Show when={shop()}>
      {(shop) => (
        <main class="max-w-xl mx-auto p-6 space-y-10">
          <h1 class="text-xl font-semibold">Paramètres de la boutique</h1>

          {/* WhatsApp */}
          <section>
            <h2 class="text-lg font-medium mb-2">Numéro WhatsApp</h2>
            <form action={updateWhatsAppAction} method="post" class="flex gap-2">
              <input
                name="whatsappNumber"
                placeholder="ex: 261340000000"
                value={shop().whatsappNumber ?? ""}
                class="flex-1 border rounded px-3 py-2"
              />
              <button type="submit" disabled={whatsappSubmission.pending} class="bg-black text-white rounded px-4 py-2">
                Enregistrer
              </button>
            </form>
            <Show when={whatsappSubmission.error}>
              <p class="text-red-600 text-sm mt-1">{(whatsappSubmission.error as Error).message}</p>
            </Show>
          </section>

          {/* Comptes de paiement */}
          <section>
            <h2 class="text-lg font-medium mb-2">Comptes de paiement</h2>
            <ul class="space-y-2 mb-4">
              <For each={shop().paymentAccounts}>
                {(account) => (
                  <li class="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <span>
                      {PROVIDER_OPTIONS.find((p) => p.value === account.provider)?.label ?? account.provider} — {account.phoneNumber} (
                      {account.accountHolderName})
                    </span>
                    <form action={deletePaymentAccountAction} method="post">
                      <input type="hidden" name="accountId" value={account.id} />
                      <button type="submit" class="text-red-600 text-xs">
                        Supprimer
                      </button>
                    </form>
                  </li>
                )}
              </For>
            </ul>

            <form action={addPaymentAccountAction} method="post" class="space-y-2 border-t pt-4">
              <select name="provider" required class="w-full border rounded px-3 py-2">
                <For each={PROVIDER_OPTIONS}>{(option) => <option value={option.value}>{option.label}</option>}</For>
              </select>
              <input name="phoneNumber" placeholder="Numéro" required class="w-full border rounded px-3 py-2" />
              <input name="accountHolderName" placeholder="Nom du titulaire" required class="w-full border rounded px-3 py-2" />
              <button type="submit" disabled={addAccountSubmission.pending} class="bg-black text-white rounded px-4 py-2">
                Ajouter le compte
              </button>
              <Show when={addAccountSubmission.error}>
                <p class="text-red-600 text-sm">{(addAccountSubmission.error as Error).message}</p>
              </Show>
            </form>
          </section>

          {/* Zones de livraison */}
          <section>
            <h2 class="text-lg font-medium mb-2">Zones de livraison</h2>
            <ul class="space-y-2 mb-4">
              <For each={shop().deliveryZones}>
                {(zone) => (
                  <li class="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <span>
                      {zone.zone} — {formatPrice(zone.fee)}
                    </span>
                    <form action={deleteDeliveryZoneAction} method="post">
                      <input type="hidden" name="zoneId" value={zone.id} />
                      <button type="submit" class="text-red-600 text-xs">
                        Supprimer
                      </button>
                    </form>
                  </li>
                )}
              </For>
            </ul>

            <form action={addDeliveryZoneAction} method="post" class="space-y-2 border-t pt-4">
              <input name="zone" placeholder="ex: Antananarivo centre" required class="w-full border rounded px-3 py-2" />
              <input name="fee" type="number" min="0" step="1" placeholder="Tarif (Ar)" required class="w-full border rounded px-3 py-2" />
              <button type="submit" disabled={addZoneSubmission.pending} class="bg-black text-white rounded px-4 py-2">
                Ajouter la zone
              </button>
              <Show when={addZoneSubmission.error}>
                <p class="text-red-600 text-sm">{(addZoneSubmission.error as Error).message}</p>
              </Show>
            </form>
          </section>
        </main>
      )}
    </Show>
  );
}
