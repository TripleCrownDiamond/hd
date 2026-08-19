# Déploiement

## L'échec corepack sur Hostinger

```
TypeError [ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING]: A dynamic import callback was not specified.
    at Object.<anonymous> (~/.cache/node/corepack/v1/pnpm/11.21.0/bin/pnpm.cjs:3:1)
Node.js v20.19.4
ERROR: Failed to install dependencies
```

Ce n'est pas une erreur du projet. Le corepack livré avec Node 20.19 charge le
binaire pnpm dans un contexte VM sans callback d'import dynamique ; les pnpm
récents (ici 11.21.0) commencent par un `import()` de haut niveau et plantent
avant d'avoir lu quoi que ce soit.

Noter aussi que corepack a récupéré **pnpm 11.21.0** alors que `packageManager`
épingle **pnpm 10.28.2** — l'hôte a donc lancé un `corepack prepare pnpm@latest`
quelque part, au lieu d'honorer le champ.

## Le contournement, par ordre de préférence

### 1. Contourner corepack (recommandé, rien à changer chez l'hébergeur)

```bash
npm run deploy:install
npm run deploy:build
```

`deploy:install` appelle `npx --yes pnpm@10.28.2 install --frozen-lockfile`.
`npx` récupère pnpm depuis le registre npm sans passer par corepack, donc le
bug ne peut pas se produire, et la version reste celle du lockfile.

`--prod=false` est explicite : Next a besoin des devDependencies (TypeScript,
Tailwind) pour construire, même en production.

### 2. Passer l'application en Node 22

Le corepack de Node 22 n'a pas ce défaut. Le dépôt contient un `.nvmrc` qui
demande Node 22 ; les hébergeurs qui le lisent basculeront seuls.

### 3. Mettre corepack à jour sur l'hôte

```bash
npm install -g corepack@latest
corepack enable
```

À refaire après chaque changement de version de Node par l'hébergeur.

## Variables d'environnement requises

Reprendre `.env.example`. Sans elles, le build passe mais le site ne sert rien
d'utile.

| Variable | Nécessaire pour |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | catalogue, comptes, commandes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | idem |
| `SUPABASE_SECRET_KEY` | écritures serveur, webhooks, factures |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASSWORD` | e-mails transactionnels |
| `SMTP_FROM_EMAIL` | expéditeur affiché |
| `ADMIN_EMAIL` | notification de nouvelle commande |
| `NEXT_PUBLIC_IMAGEKIT_ID` `NEXT_PUBLIC_IMAGEKIT_URL` | images produits |

Ne jamais committer ces valeurs. Sur Hostinger elles se saisissent dans le
panneau Node.js de l'application ; en local elles vont dans `.env.local`, qui
est ignoré par git.

## Migrations à appliquer

La base est hébergée et aucune migration n'a été poussée depuis les sessions de
développement. À appliquer avant la mise en ligne :

```
20260809000012_product_sales_unit.sql
20260809000013_log_kind.sql
20260809000014_log_category.sql
```

Le code tolère leur absence — le catalogue retombe sur les anciennes colonnes et
`/stammholz` s'affiche vide plutôt qu'en erreur — mais le Grundpreis à la tonne
n'apparaîtra qu'après.
