# Instructions projet HOLZKRAFT

## Mission

Construire progressivement la boutique allemande décrite dans le PRD. Continuer de manière autonome tant qu’une prochaine action sûre, locale et vérifiable existe. Ne pas inventer les informations commerciales, légales, fiscales, techniques ou de conformité qui dépendent de l’entreprise ou des fournisseurs.

## Lecture obligatoire

Avant toute modification :

1. lire `docs/PROJECT_STATUS.md` ;
2. lire la section pertinente du PRD ;
3. pour le frontend, lire `.ulpi/design/DESIGN.md` puis `.ulpi/design/storefront.md` ;
4. pour le backend, lire `docs/BACKEND.md` et `docs/ARCHITECTURE.md` ;
5. lire `docs/IMPLEMENTATION_PLAN.md` et travailler sur la première tranche prête.

Ne pas relire les trois longs documents sources en entier à chaque tâche. Utiliser leurs titres et `rg` pour ouvrir uniquement les sections nécessaires.

## Autonomie

- Faire des hypothèses réversibles quand elles ne changent ni le droit, ni l’argent, ni les données réelles.
- Documenter toute hypothèse durable dans `docs/DECISIONS.md`.
- Continuer jusqu’à ce que la tranche demandée soit implémentée et vérifiée.
- Ne pas publier, déployer en production, envoyer d’e-mail réel, contacter un tiers ou activer un paiement sans demande explicite.
- Ne jamais remplir un placeholder légal ou d’entreprise avec une donnée inventée.
- Ne jamais utiliser de contenu fournisseur sans autorisation documentée.
- Ne jamais contourner un test, RLS, webhook signé, contrôle d’autorisation ou garde-fou de conformité pour faire passer une démo.

## Commandes

Le code n’est pas encore scaffoldé. Lors du Sprint 1, définir dans `package.json` et maintenir :

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Utiliser `pnpm`. Ne pas mélanger les gestionnaires de paquets. Mettre à jour cette section dès que les commandes réelles existent.

## Frontend

- Utiliser Next.js App Router, TypeScript strict, Tailwind CSS, Radix primitives et shadcn/ui thémés.
- Les Server Components sont la valeur par défaut. Ajouter `use client` uniquement à la frontière interactive minimale.
- Toute interface client visible est en allemand `de-DE`; code, noms techniques et documentation interne peuvent être en anglais ou français cohérent.
- Utiliser uniquement les tokens de `.ulpi/design/DESIGN.md`.
- Préserver WCAG 2.2 AA, focus visible, navigation clavier, annonces accessibles, cibles tactiles et `prefers-reduced-motion`.
- Interdire les faux badges, faux certificats, faux avis attribués à une plateforme et affirmations environnementales non prouvées.
- Les prix, stocks, délais et certifications affichés doivent provenir de données validées, ou être explicitement marqués fictifs dans les fixtures.

## Backend

- Supabase/PostgreSQL est la source de vérité. Toute table exposée doit avoir RLS activée et une politique explicite.
- Prix en centimes entiers, devise EUR, TVA figée sur les lignes de commande.
- Recalculer côté serveur prix, taxes, livraison, disponibilité et total.
- Les webhooks sont signés, idempotents et rejouables.
- Ne jamais exposer les clés secrètes, la clé Supabase privilégiée, les tokens de paiement ou les données de carte.
- Une facture émise et les snapshots de commande sont immuables. Toute correction produit un document distinct et audité.
- Séparer statut de commande, paiement, livraison et notification.
- Les échecs d’e-mail ou Telegram ne doivent jamais annuler ou dupliquer une commande.

## Qualité

- Valider en proportion du changement : lint, types, tests ciblés, puis build pour une tranche intégrée.
- Tester les parcours critiques avec Playwright : catalogue, devis livraison, panier, checkout, suivi protégé et accès facture.
- Ajouter au minimum les états loading, empty, error, unauthorized et success.
- Ne pas déclarer terminé avec des TODO silencieux. Inscrire les éléments bloqués dans `docs/PROJECT_STATUS.md` avec le besoin exact.
- Après chaque tranche, mettre à jour `docs/PROJECT_STATUS.md` et `docs/IMPLEMENTATION_PLAN.md`.

## MCP

- Utiliser OpenAI Docs pour les surfaces Codex/OpenAI.
- Utiliser Context7 pour vérifier les API actuelles de Next.js, Supabase, Stripe, Resend et bibliothèques avant implémentation.
- Utiliser Playwright MCP pour inspecter l’interface rendue et les parcours navigateur.
- Les MCP sont une aide de contexte et de test, jamais une source d’autorisation commerciale ou juridique.
