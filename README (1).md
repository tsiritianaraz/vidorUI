# Base de données Vidor — mise en place

## 1. Installer les dépendances (dans ton projet SolidStart)

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

## 2. Copier ces fichiers dans ton projet

- `src/db/schema.ts` → le schéma des tables
- `src/db/client.ts` → le client de connexion
- `drizzle.config.ts` → la config de Drizzle Kit (à la racine du projet)
- `docker-compose.yml` → PostgreSQL local pour développer (à la racine)
- `.env.example` → copie-le en `.env` et ajuste si besoin

## 3. Démarrer PostgreSQL en local

```bash
docker compose up -d
```

## 4. Générer et appliquer la première migration

```bash
npx drizzle-kit generate   # crée le fichier SQL de migration dans ./drizzle
npx drizzle-kit migrate    # applique la migration sur la base
```

## 5. Explorer la base (optionnel mais pratique)

```bash
npx drizzle-kit studio
```

Ouvre une interface web pour voir/éditer les données directement.

## Note pour plus tard (hébergement Cloudflare)

Le client actuel (`src/db/client.ts`) utilise le driver `pg` classique
(connexion TCP), qui fonctionne en local et sur la plupart des hébergeurs
Node. Si tu passes sur Cloudflare Workers plus tard, le driver `pg` ne
fonctionnera pas tel quel (pas de TCP natif sur Workers) — il faudra basculer
vers un driver HTTP compatible edge (ex: `@neondatabase/serverless` si ta
base est chez Neon, ou Cloudflare Hyperdrive). Le `schema.ts` lui ne change
pas : seul `client.ts` sera à adapter.

## Ordre logique une fois la base en place

1. Insérer manuellement quelques `categories` de départ (Mode, Informatique,
   Cuisine...) — table gérée par l'admin.
2. Brancher le flow de vérification vendeur : à la connexion OAuth, créer
   une ligne dans `vendeurs`, puis dans `boutiques` une fois la Page liée.
3. Construire l'espace vendeur (CRUD `produits` + `photos`).
