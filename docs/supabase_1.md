# Supabase — mise en route

Ce guide donne le strict nécessaire pour amener le projet d'un `git clone` à
une base Postgres locale complète avec RLS activée.

## Prérequis

- Docker Desktop actif (le CLI Supabase orchestre 6 conteneurs).
- Node 20+ et pnpm.
- `pnpm install` déjà fait — le CLI Supabase est installé en devDependency.

## Démarrer la stack locale

```bash
pnpm run db:start
```

Au premier démarrage, le CLI télécharge les images Postgres/Studio/etc., applique
`supabase/migrations/*.sql` dans l'ordre, puis exécute `supabase/seed.sql`.

Le CLI imprime alors quatre valeurs à copier dans `.env.local` :

```
API URL         → NEXT_PUBLIC_SUPABASE_URL
anon key        → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
service_role    → SUPABASE_SECRET_KEY   (jamais côté client)
Studio URL      → http://127.0.0.1:54323 (interface web locale)
```

Toutes les routes utiles :

| Service | Port | Note |
| --- | --- | --- |
| API REST/gRPC | 54321 | Anon + service_role |
| Postgres | 54322 | Utilisateur `postgres` |
| Shadow (migrations diff) | 54320 | Interne CLI |
| Studio | 54323 | UI web |
| Inbucket (mails de dev) | 54324 | Voir les emails signup/reset |

## Cycle de développement

```bash
# Redémarrer une base propre après changement de schéma
pnpm run db:reset

# Générer une nouvelle migration à partir des différences de schéma
pnpm run db:diff nom_de_la_migration
# → écrit supabase/migrations/<timestamp>_nom_de_la_migration.sql

# Régénérer les types TypeScript (à faire après chaque migration)
pnpm run db:types
```

## Migrations livrées

Ordre d'application (les timestamps garantissent l'ordre) :

1. `20260729000001_init.sql` — extensions (`pgcrypto`, `pg_trgm`, `citext`),
   trigger `set_updated_at`, enum `app_role`.
2. `20260729000002_identity.sql` — `profiles`, `addresses`, `user_roles`,
   `audit_logs`, helpers `has_role`/`has_any_role`, trigger d'auto-création de
   profil sur signup `auth.users`.
3. `20260729000003_catalog.sql` — `brands`, `economic_operators`, `categories`,
   `products` (colonnes typées + `extra jsonb`), `product_variants`,
   `product_media`, `product_documents`, `product_compliance_checks`, enum
   `product_kind`, `media_kind`.
4. `20260729000004_rls.sql` — RLS activée sur toutes les tables client, lectures
   publiques uniquement pour les produits `is_published AND review_status = 'approved'`,
   écritures réservées aux rôles `content_editor`/`admin`. `audit_logs` n'a
   aucune policy → écritures uniquement en `service_role`.

## Buckets Storage

Créés automatiquement via `supabase/config.toml` :

- `products` — public, images JPG/PNG/WebP/AVIF, 20 MiB max.
- `documents` — privé, PDF, 20 MiB max. URLs signées uniquement.
- `invoices` — privé, PDF, 10 MiB max. URLs signées, accès restreint aux
  clients concernés.

## Sécurité des clés

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sont
  publiques (elles arrivent dans le bundle client). La RLS est le seul rempart.
- `SUPABASE_SECRET_KEY` (alias `SUPABASE_SERVICE_ROLE_KEY`) est **service_role** :
  elle contourne toute RLS. Utilisée uniquement dans `src/lib/db/server.ts:getServiceSupabase()`
  depuis des cas d'usage privilégiés qui vérifient déjà les permissions et
  auditent leur action dans `public.audit_logs`.

## Depuis l'application Next.js

- Côté navigateur : `import { getBrowserSupabase } from "@/lib/db/client"`.
- Catalogue public sans session :
  `import { getPublicSupabase } from "@/lib/db/server"` — clé publique et RLS
  anonyme, jamais de clé privilégiée.
- Côté serveur (Server Component, Server Action, Route Handler) :
  `import { getServerSupabase } from "@/lib/db/server"` — respecte la session
  cookie et la RLS.
- Côté serveur privilégié : `getServiceSupabase()` — jamais depuis le browser
  bundle (`import "server-only"` bloque).

## Catalogue staging

```bash
pnpm db:check
pnpm db:import:spartherm
```

- `db:check` compare la vue publique RLS aux volumes staging sans afficher de
  secret.
- `db:import:spartherm` importe `published.jsonl` en staging uniquement :
  produits `pending`, non publiés, et contrôles de conformité `pending`.
- La publication ne fait pas partie de ce script.

## Environnement de prod

1. Créer un projet Supabase hébergé.
2. Cloner les migrations vers le projet distant :
   ```bash
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <ref>
   pnpm exec supabase db push
   ```
3. Recopier `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   et `SUPABASE_SECRET_KEY` dans les variables d'environnement Vercel/Fly/Docker.
4. Rechecker les policies avec un compte non-admin avant chaque déploiement.
