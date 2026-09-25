import { relations } from "drizzle-orm";
import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const verificationStatusEnum = pgEnum("verification_status", ["pending", "verified", "rejected", "expired"]);

export const mobileMoneyProviderEnum = pgEnum("mobile_money_provider", ["mvola", "orange_money", "airtel_money"]);

export const stockStatusEnum = pgEnum("stock_status", ["in_stock", "out_of_stock"]);

export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);

// ---------- Tables ----------

export const sellers = pgTable(
  "sellers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facebookUserId: text("facebook_user_id").notNull(),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sellers_facebook_user_id_idx").on(table.facebookUserId)],
);

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id, { onDelete: "cascade" })
      .unique(), // 1 seller = 1 shop for the MVP
    facebookPageId: text("facebook_page_id").notNull(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    followersCount: integer("followers_count").default(0),
    pageCreatedAt: timestamp("page_created_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("shops_facebook_page_id_idx").on(table.facebookPageId), uniqueIndex("shops_slug_idx").on(table.slug)],
);

export const paymentAccounts = pgTable("payment_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  provider: mobileMoneyProviderEnum("provider").notNull(),
  phoneNumber: text("phone_number").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  zone: text("zone").notNull(),
  fee: numeric("fee", { precision: 12, scale: 2 }).notNull(),
});

// Global categories, managed only by the platform admin
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("categories_name_idx").on(table.name)],
);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  size: text("size"), // optional: not every product has a size
  stockStatus: stockStatusEnum("stock_status").notNull().default("in_stock"),
  status: productStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

// ---------- Relations (for `db.query` style requests) ----------

export const sellersRelations = relations(sellers, ({ one }) => ({
  shop: one(shops, {
    fields: [sellers.id],
    references: [shops.sellerId],
  }),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  seller: one(sellers, {
    fields: [shops.sellerId],
    references: [sellers.id],
  }),
  paymentAccounts: many(paymentAccounts),
  deliveryZones: many(deliveryZones),
  products: many(products),
}));

export const paymentAccountsRelations = relations(paymentAccounts, ({ one }) => ({
  shop: one(shops, {
    fields: [paymentAccounts.shopId],
    references: [shops.id],
  }),
}));

export const deliveryZonesRelations = relations(deliveryZones, ({ one }) => ({
  shop: one(shops, {
    fields: [deliveryZones.shopId],
    references: [shops.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  product: one(products, {
    fields: [photos.productId],
    references: [products.id],
  }),
}));
