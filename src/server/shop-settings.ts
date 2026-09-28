import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { shops, paymentAccounts, deliveryZones } from "../db/schema";

async function requireOwnShop(sellerId: string) {
  const shop = await db.query.shops.findFirst({
    where: eq(shops.sellerId, sellerId),
  });
  if (!shop) {
    throw new Error("Aucune boutique associée à ce vendeur.");
  }
  return shop;
}

export async function getShopSettings(sellerId: string) {
  const shop = await requireOwnShop(sellerId);
  return db.query.shops.findFirst({
    where: eq(shops.id, shop.id),
    with: {
      paymentAccounts: true,
      deliveryZones: true,
    },
  });
}

export async function updateWhatsAppNumber(
  sellerId: string,
  whatsappNumber: string
) {
  const shop = await requireOwnShop(sellerId);
  await db
    .update(shops)
    .set({ whatsappNumber: whatsappNumber.trim() || null })
    .where(eq(shops.id, shop.id));
}

export interface PaymentAccountInput {
  provider: "mvola" | "orange_money" | "airtel_money";
  phoneNumber: string;
  accountHolderName: string;
}

export async function addPaymentAccount(
  sellerId: string,
  input: PaymentAccountInput
) {
  const shop = await requireOwnShop(sellerId);

  if (!input.phoneNumber.trim() || !input.accountHolderName.trim()) {
    throw new Error("Numéro et nom du titulaire requis.");
  }

  await db.insert(paymentAccounts).values({
    shopId: shop.id,
    provider: input.provider,
    phoneNumber: input.phoneNumber.trim(),
    accountHolderName: input.accountHolderName.trim(),
  });
}

export async function deletePaymentAccount(
  sellerId: string,
  accountId: string
) {
  const shop = await requireOwnShop(sellerId);
  await db
    .delete(paymentAccounts)
    .where(
      and(
        eq(paymentAccounts.id, accountId),
        eq(paymentAccounts.shopId, shop.id) // empêche de supprimer le compte d'un autre vendeur
      )
    );
}

export interface DeliveryZoneInput {
  zone: string;
  fee: number;
}

export async function addDeliveryZone(
  sellerId: string,
  input: DeliveryZoneInput
) {
  const shop = await requireOwnShop(sellerId);

  if (!input.zone.trim()) {
    throw new Error("Le nom de la zone est requis.");
  }
  if (input.fee < 0) {
    throw new Error("Le tarif ne peut pas être négatif.");
  }

  await db.insert(deliveryZones).values({
    shopId: shop.id,
    zone: input.zone.trim(),
    fee: input.fee.toFixed(2),
  });
}

export async function deleteDeliveryZone(sellerId: string, zoneId: string) {
  const shop = await requireOwnShop(sellerId);
  await db
    .delete(deliveryZones)
    .where(
      and(
        eq(deliveryZones.id, zoneId),
        eq(deliveryZones.shopId, shop.id) // empêche de supprimer la zone d'un autre vendeur
      )
    );
}
