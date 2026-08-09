# Spécification backend

## Objectif

Fournir un backend e-commerce sûr pour l’Allemagne, sans transformer les fixtures du prototype en données commerciales réelles.

## Invariants

1. Tous les montants sont des entiers en centimes, devise `EUR`.
2. Le serveur recalcule produit, variante, remise autorisée, TVA, livraison et total.
3. Une ligne de commande est un snapshot immuable.
4. Les statuts commande, paiement, livraison, facture et notification sont distincts.
5. Toute transition sensible est autorisée, validée et auditée.
6. Toute table accessible par un client possède RLS et des tests de politique.
7. Aucun secret, PAN, CVV, mot de passe ou token brut ne se trouve dans les logs.
8. Une facture émise n’est jamais remplacée.
9. Une notification externe échouée est rejouable et n’annule pas la transaction métier.
10. Un produit réglementé ne peut être publié si son dossier obligatoire est incomplet.

## Schéma par domaine

### Identité et accès

- `profiles`
- `addresses`
- `roles`
- `permissions`
- `user_roles`
- `admin_mfa_events`
- `audit_logs`

RLS :

- un client lit et modifie uniquement son profil et ses adresses ;
- le support voit seulement les données nécessaires au dossier ;
- la logistique voit seulement les données nécessaires à la livraison ;
- les opérations privilégiées passent par un cas d’usage serveur.

### Catalogue

- `categories`
- `products`
- `product_variants`
- `product_media`
- `product_documents`
- `economic_operators`
- `product_compliance_checks`
- `product_recalls`

La publication exige :

- identité produit et opérateur économique ;
- attributs propres au type ;
- prix et unité de base ;
- médias autorisés ;
- avertissements ;
- documents obligatoires pour les poêles ;
- preuve et période de validité de toute certification revendiquée.

### Inventaire

- `warehouses`
- `inventory_lots`
- `inventory_movements`
- `inventory_reservations`

Une réservation :

- possède une expiration ;
- référence une variante, un lot et un dépôt ;
- est créée dans une transaction protégée ;
- est confirmée après paiement valide ou libérée après expiration/échec.

### Livraison

- `delivery_zones`
- `delivery_zone_postcodes`
- `delivery_rates`
- `delivery_quotes`
- `shipments`

Entrées du moteur :

- code postal ;
- type et quantité de lignes ;
- poids, volume, palettes ;
- contraintes d’accès ;
- mode de déchargement ;
- retrait éventuel.

Sortie signée côté serveur :

- disponibilité ;
- prix ;
- date d’expiration ;
- minimum ;
- délai ;
- service ;
- contraintes visibles ;
- version de règle utilisée.

Le checkout refuse un devis expiré ou incompatible avec le panier.

### Panier et commande

- `carts`
- `cart_items`
- `orders`
- `order_items`
- `order_events`
- `legal_acceptances`

Création de commande :

1. verrouiller/revalider les variantes ;
2. recalculer les montants ;
3. revalider le devis livraison ;
4. enregistrer les snapshots produit et réglementaire ;
5. lier les versions AGB/Widerruf ;
6. réserver le stock ;
7. créer le paiement ou le virement ;
8. écrire l’événement initial ;
9. committer ;
10. créer les jobs de notification.

### Paiement

- `payments`
- `payment_attempts`
- `payment_webhook_events`
- `payment_provider_configs`
- `saved_payment_methods`
- `bank_transfers`
- `refunds`

Contrat d’adaptateur :

```ts
interface PaymentProvider {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>;
  getPaymentStatus(reference: string): Promise<PaymentState>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(input: RawWebhook): Promise<VerifiedPaymentEvent>;
}
```

Les détails spécifiques à un prestataire restent dans l’adaptateur. Les événements reçus sont conservés avec un identifiant unique, un hash de charge utile si nécessaire et un résultat de traitement.

Les moyens enregistrés ne stockent que les identifiants tokenisés et les métadonnées d’affichage autorisées. Toute charge hors session vérifie le consentement, la permission, l’idempotence et les exigences d’authentification.

### Facturation

- `invoices`
- `invoice_documents`
- `invoice_sequences`
- `invoice_events`

Émission :

- transaction serveur ;
- verrouillage de séquence ;
- numéro unique non réutilisable ;
- snapshot comptable JSON ;
- PDF A4 allemand ;
- hash SHA-256 ;
- bucket privé ;
- événement d’audit.

Une correction crée une annulation, facture rectificative ou avoir selon le processus validé. La nature fiscale exacte reste à valider par le conseiller fiscal.

### CMS et juridique

- `pages`
- `page_revisions`
- `blog_posts`
- `blog_categories`
- `legal_document_versions`

Une version juridique utilisée par une commande ne peut être supprimée. La publication exige auteur, date d’effet, version et audit. Un texte généré par IA reste marqué non validé jusqu’à approbation humaine.

### Notifications et support

- `notification_jobs`
- `email_events`
- `telegram_events`
- `conversations`
- `conversation_messages`
- `support_tickets`
- `ai_knowledge_documents`

La file de jobs comporte :

- clé d’idempotence ;
- nombre de tentatives ;
- prochain essai ;
- statut ;
- erreur nettoyée ;
- verrou de traitement.

L’assistant ne lit que le catalogue publié, les pages approuvées et, après vérification, le statut autorisé d’une commande. Il transfère à un humain les litiges, remboursements, sujets juridiques, sécurité produit et installations complexes.

## API initiale

| Méthode | Route | Protection |
| --- | --- | --- |
| `GET` | `/api/products` | public, cache contrôlé |
| `GET` | `/api/products/[slug]` | public, produit publié |
| `POST` | `/api/delivery/quote` | validation + rate limit |
| `POST` | `/api/cart` | session panier + CSRF si cookie |
| `POST` | `/api/checkout` | validation, idempotence, rate limit |
| `POST` | `/api/payments/session` | commande autorisée |
| `POST` | `/api/webhooks/stripe` | signature + idempotence |
| `POST` | `/api/webhooks/paypal` | signature + idempotence |
| `GET` | `/api/orders/[token]` | token signé court et données masquées |
| `GET` | `/api/invoices/[id]` | autorisation + URL signée courte |

Les mutations admin sont groupées par domaine, protégées par rôle et non exposées comme CRUD générique.

## Validation et erreurs

- Zod aux frontières réseau et environnement.
- Erreurs métier avec code stable, message interne et message utilisateur allemand séparés.
- Identifiant de corrélation par requête.
- Messages publics sans stack, identifiant prestataire ni donnée sensible.
- Rate limit sur login, contact, livraison, checkout, suivi et chat.

## Observabilité

- Logs structurés et minimisés.
- Sentry sans payload sensible.
- Mesures : erreurs paiement, latence devis, échecs webhook, réservations expirées, jobs échoués, quotas e-mail.
- Alertes sans adresse complète, contenu de chat ou secret.

## Stratégie de test

- Unitaires : calculs prix, TVA, livraison, transitions et permissions.
- Intégration : migrations, contraintes, RLS, transactions, idempotence.
- Contractuels : adaptateurs de paiement/e-mail.
- E2E : commande, échec paiement, webhook dupliqué, stock concurrent, suivi et facture protégée.
- Sécurité : accès croisé entre clients, élévation de rôle, upload, CSRF, rate limit et fuite de secrets.

## Ordre de construction

1. environnement, schéma minimal, migrations et RLS ;
2. catalogue en lecture avec fixtures ;
3. livraison ;
4. panier et réservations ;
5. commande et snapshots ;
6. paiement sandbox ;
7. notifications ;
8. facture ;
9. dashboard et RBAC ;
10. support, IA et conformité avancée.
