# Architecture cible

## Principes

- Monolithe modulaire Next.js pour le MVP.
- PostgreSQL/Supabase comme source de vérité.
- Rendu serveur par défaut, hydratation limitée.
- Intégrations externes derrière des adaptateurs.
- Événements transactionnels persistés avant les effets externes.
- Données commerciales, légales et comptables historisées.

## Vue d’ensemble

```text
Navigateur
   │
   ▼
Next.js App Router
   ├─ pages publiques et SEO
   ├─ compte client
   ├─ dashboard administrateur
   ├─ Route Handlers / Server Actions
   └─ jobs déclenchés de manière contrôlée
          │
          ▼
Supabase
   ├─ PostgreSQL + RLS
   ├─ Auth
   └─ Storage public/privé
          │
          ├─ PaymentProvider → Stripe / PayPal / virement
          ├─ MailProvider → Resend
          ├─ AdminNotifier → Telegram
          ├─ ErrorReporter → Sentry
          └─ AiProvider → fournisseur configurable
```

## Couches

### Présentation

- `src/app/` : routes, layouts, metadata et composition.
- `src/components/` : primitives et composants transversaux.
- `src/features/` : UI et logique par domaine.

### Application

- Cas d’usage explicites : devis livraison, réservation stock, création commande, paiement, émission facture, notification.
- Les cas d’usage ne dépendent pas directement des SDK externes.
- Les mutations retournent des résultats typés et des erreurs métier stables.

### Domaine

Modules :

- catalogue et conformité produit ;
- prix et taxes ;
- inventaire ;
- panier ;
- livraison ;
- commande ;
- paiement ;
- facture ;
- contenu et juridique ;
- support et assistant ;
- notifications ;
- audit.

### Infrastructure

- repositories Supabase ;
- adaptateurs de paiement ;
- Resend ;
- Telegram ;
- Storage ;
- Sentry ;
- fournisseur IA.

## Arborescence prévue

```text
src/
  app/
    (shop)/
    (legal)/
    (account)/
    admin/
    api/
  components/
    ui/
    commerce/
  features/
    catalog/
    delivery/
    cart/
    checkout/
    orders/
    payments/
    invoices/
    support/
  lib/
    auth/
    db/
    env/
    security/
    validation/
  server/
    application/
    domain/
    infrastructure/
supabase/
  migrations/
  seed.sql
tests/
  unit/
  integration/
  e2e/
```

## Frontières de confiance

| Frontière | Règle |
| --- | --- |
| Navigateur → serveur | Toute donnée est non fiable et revalidée |
| Serveur → Supabase | Client utilisateur pour RLS, client privilégié seulement dans un cas d’usage serveur autorisé |
| Prestataire → webhook | Signature, fraîcheur, idempotence et schéma validés |
| Admin → action sensible | RBAC, MFA/réauthentification, confirmation et audit |
| Storage → téléchargement | Bucket privé et URL signée courte après autorisation |
| IA → contenu | Lecture sur corpus approuvé, aucune mutation sensible autonome |

## Flux de commande

```text
Panier
  → devis serveur livraison
  → recalcul prix/taxe/stock
  → réservation temporaire
  → snapshot commande + textes légaux
  → création paiement ou virement
  → webhook signé
  → transition paiement
  → transition commande
  → émission facture selon politique
  → jobs Resend/Telegram
```

Chaque transition importante ajoute un événement immuable. Un retour navigateur ne confirme jamais un paiement.

## Portabilité

- Variables standard et validation au démarrage.
- Migrations SQL versionnées.
- Aucun traitement indispensable uniquement dans Vercel.
- Pas de logique métier uniquement configurée dans un dashboard tiers.
- Export des médias, données et documents prévu.
- Adaptateurs pour remplacer paiement, e-mail et IA.
