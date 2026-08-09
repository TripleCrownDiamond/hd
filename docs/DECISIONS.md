# Registre de décisions

## ADR-001 — Monolithe modulaire

- Statut : accepté
- Décision : utiliser une seule application Next.js pour le MVP, organisée par domaines.
- Pourquoi : réduit la complexité opérationnelle tout en préservant des frontières testables.
- Réexamen : si les jobs, le trafic ou l’équipe justifient un service séparé.

## ADR-002 — Supabase sans ORM supplémentaire au départ

- Statut : accepté
- Décision : migrations SQL et client Supabase typé.
- Pourquoi : éviter une deuxième couche de schéma avant qu’un besoin concret n’apparaisse.
- Réexamen : seulement si les requêtes ou transactions deviennent nettement plus sûres avec un outil dédié.

## ADR-003 — Radix primitives + shadcn/ui

- Statut : accepté
- Décision : construire l’interface sur Radix et shadcn/ui, puis appliquer les tokens HOLZKRAFT.
- Pourquoi : accessibilité et comportements cohérents sans recréer les primitives.

## ADR-004 — Autonomie limitée au workspace

- Statut : accepté
- Décision : Codex fonctionne avec approbations désactivées dans un sandbox `workspace-write` et réseau activé.
- Pourquoi : avancer sans interruptions sur le dépôt tout en évitant un accès disque global par défaut.
- Limite : aucun déploiement, envoi réel ou activation commerciale sans instruction explicite.

## ADR-005 — Fixtures explicitement fictives

- Statut : accepté
- Décision : utiliser des marques et produits fictifs jusqu’à obtention des droits fournisseur.
- Pourquoi : éviter les violations de droits et les fausses affirmations de conformité.

## ADR-006 — MCP de base

- Statut : accepté
- Décision : OpenAI Docs, Context7 et Playwright.
- Pourquoi : documentation Codex, documentation technique actuelle et validation navigateur.
- Limite : aucun MCP n’est une source juridique ou une autorisation d’action externe.

## ADR-007 — Formulaires interactifs extraits en client components

- Statut : accepté
- Décision : les `<form onSubmit={...}>` et gestionnaires d'événements sont isolés dans des composants clients dédiés (ex : `components/account/login-form.tsx`, `components/layout/footer-newsletter.tsx`), et les pages parentes restent des Server Components.
- Pourquoi : Next.js 15 + React 19 refusent de sérialiser un event handler passé au travers d'une frontière Server → Client lors du prerender statique, même si la page cible est déclarée `"use client"` dans son fichier racine. Isoler l'interactivité rend le SSG déterministe et permet à la page hôte de conserver `generateMetadata`, revalidation ISR et RSC data-fetching.
- Conséquences : le pattern habituel « page = server component orchestrant du contenu SEO, forms = petites îles clients » est appliqué partout où un handler est nécessaire.
- Réexamen : si Next.js supprime cette contrainte dans une version future.

## ADR-008 — Supabase comme seule source catalogue du storefront

- Statut : accepté
- Décision : les pages publiques lisent catégories, produits, variantes et
  médias via le client Supabase public soumis à RLS. Aucun fallback automatique
  vers `data/scraped/*.jsonl` ou `src/lib/fixtures.ts` n'est autorisé.
- Pourquoi : un fallback masquerait une panne ou une absence de publication et
  pourrait afficher des données non approuvées.
- Conséquences : un catalogue sans ligne approuvée affiche un état vide
  explicite. Les JSONL restent des entrées de staging pour les importeurs. Les
  avis, guides et devis de livraison de démonstration ne sont plus affichés.
  Sous `NODE_ENV=development` uniquement, le repository serveur peut employer
  le client privilégié pour montrer les lignes staging dans une vue de revue
  explicitement non commerciale. Cet aperçu reste en lecture seule, masque les
  données réglementaires non validées et désactive devis, comparaison et achat.
  Il peut afficher un prix fabricant tracé pour les produits configurés avec un
  prix public. En production, seules les lignes autorisées par la RLS publique
  sont visibles.

## ADR-009 — Import fabricant en staging avant conformité

- Statut : accepté
- Décision : un import fabricant crée ou met à jour les produits avec
  `review_status = pending` et `is_published = false`, ainsi que les contrôles
  de conformité `pending`.
- Pourquoi : présence dans un catalogue fabricant, autorisation média et
  conformité réglementaire sont trois preuves distinctes.
- Conséquences : aucun rapprochement HKI ambigu n'active automatiquement un
  produit. La publication exige une revue humaine et les preuves fabricant.
- Réexamen : lorsqu'un workflow admin audité implémentera l'approbation.

## ADR-010 — Séparer prix, devis et droits de contenu par source

- Statut : accepté
- Décision : conserver les produits Spartherm existants en mode devis et
  importer les produits HARK avec leurs prix fabricant TTC. Exclure les
  coordonnées du fabricant HARK. Sans autorisation documentée, conserver les
  URL d'images et métadonnées documentaires HARK uniquement en staging, sans
  télécharger, héberger ni afficher ces contenus.
- Pourquoi : le modèle commercial diffère selon la source, tandis que le droit
  de consulter une page publique ne constitue pas une autorisation de
  republication de ses textes, images ou fichiers.
- Conséquences : les cartes et fiches HARK affichent un prix à partir de la
  variante la moins chère ; les fiches Spartherm affichent `Auf Anfrage`. Un
  bouton de fichier n'existe que lorsqu'un PDF est réellement stocké dans le
  bucket privé Supabase et servi par URL signée. Les 87 produits restent
  `pending` et non publiés jusqu'à revue de conformité.
- Réexamen : à réception d'une autorisation HARK précisant les droits sur les
  textes, images et documents.

## ADR-011 — Autorisation des textes et images fabricant HARK

- Statut : accepté
- Décision : l’entreprise confirme disposer des droits de réutilisation des
  textes et images HARK. Les futurs scrapes marquent ces deux familles de
  contenu comme autorisées ; les images sont copiées dans Cloudinary avec leur
  URL source conservée, puis référencées dans `product_media`.
- Pourquoi : rendre les fiches et cartes identifiables sans dépendre à chaud du
  serveur fabricant, tout en conservant la traçabilité de chaque média.
- Conséquences : l’ancien blocage de droits sur les textes et images HARK est
  levé. Cette autorisation ne valide ni les documents PDF, ni la conformité
  réglementaire, ni l’opérateur économique, ni la mise en vente. Les produits
  restent `pending` jusqu’à la revue prévue par ADR-009 et sont présentés avec
  le badge factuel `Herstellerdaten`.
- Réexamen : si le périmètre ou la durée de l’autorisation fournisseur change.

## ADR-012 — Marque seule, sans opérateur économique ni contact fabricant

- Statut : accepté
- Décision : sur le site, seule la marque est affichée pour identifier le
  fabricant. Les opérateurs économiques, adresses et coordonnées des fabricants
  ne sont ni collectés ni affichés. La ligne `economic_operators` Spartherm
  préexistante a été supprimée et les produits déliés (`economic_operator_id =
  null`).
- Pourquoi : le périmètre autorisé couvre la marque mais pas les données de
  contact ou légales fabricant.
- Conséquences : les pages et cartes n'affichent que `brand` ; la table
  `economic_operators` reste vide. Une obligation GPSR exigeant un opérateur
  économique devra être revalidée séparément avant publication des ventes.
- Réexamen : si une obligation réglementaire rend l'opérateur économique
  obligatoire, après validation des données avec l'entreprise.

## ADR-013 — Backoffice audité, suppressions réversibles et factures verrouillées

- Statut : accepté
- Décision : toutes les routes admin exigent un rôle Supabase explicite. Une
  suppression produit devient un archivage réversible ; une facture émise est
  immuable en base et toute correction exige un nouveau document.
- Pourquoi : les données de commande et de facture doivent rester auditables ;
  un CRUD générique avec suppression physique détruirait cette traçabilité.
- Conséquences : les actions admin valident leurs entrées avec Zod, respectent
  RLS et écrivent `audit_logs`. L'émission numérotée et le PDF restent bloqués
  jusqu'à validation fiscale et configuration d'une séquence légale.
- Réexamen : après validation du processus de facturation et des durées de
  conservation par le conseiller fiscal.

## ADR-014 — Coordonnées conditionnelles et newsletter en attente de confirmation

- Statut : accepté
- Décision : adresse, téléphone, réseaux sociaux et numéros légaux proviennent
  uniquement de `site_settings` et ne sont affichés que s'ils sont renseignés.
  Une inscription newsletter crée un enregistrement `pending`, jamais un faux
  succès d'envoi.
- Pourquoi : le projet interdit les données d'entreprise inventées et Resend
  n'est pas encore configuré avec une identité d'envoi autorisée.
- Conséquences : les anciennes coordonnées et méthodes de paiement fictives du
  footer sont retirées. L'activation `subscribed` attendra le double opt-in via
  le futur job Resend signé et idempotent.
- Réexamen : quand le domaine expéditeur et le flux double opt-in sont validés.

## ADR-015 — Description factuelle et image principale à confiance stricte

- Statut : accepté
- Décision : une description produit générée est présentée comme du HTML
  nettoyé dans la zone d'achat. Une image de galerie ne remplace le héros que
  si l'image courante est explicitement une pièce/détail et si le nouveau média
  identifie le modèle avec un niveau de confiance élevé.
- Pourquoi : le premier média fournisseur peut être un accessoire, tandis qu'un
  réordonnancement fondé uniquement sur un score lexical peut promouvoir une
  autre pièce sans rapport. Les textes marketing ne doivent pas être copiés ni
  des faits absents inventés.
- Conséquences : les cas sûrs sont corrigés automatiquement et restent
  auditables ; les produits sans description factuelle ou média restent en
  revue, et les galeries ambiguës demandent une validation humaine.
- Réexamen : lorsque les fournisseurs exposeront un rôle de média fiable ou
  qu'une revue visuelle humaine aura validé les cas restants.

## Modèle pour une nouvelle décision

```text
## ADR-NNN — Titre
- Statut : proposé | accepté | remplacé
- Décision :
- Pourquoi :
- Conséquences :
- Réexamen :
```
# 2026-08-02 — Promotions, factures, assistant et paniers abandonnés

- Les remises sont toujours recalculées côté serveur. Les pourcentages sont stockés en points de base, les montants en centimes EUR, et la remise est ventilée sans erreur d'arrondi sur les lignes éligibles.
- Le seuil de livraison gratuite utilise le sous-total marchand avant promotion. Une promotion ne retire donc pas après coup une livraison gratuite déjà acquise.
- Une facture reçoit son numéro dans une fonction PostgreSQL atomique. Son PDF, son hash et le snapshot entreprise/commande deviennent immuables à l'émission ; une correction devra créer un document distinct.
- Le chatbot est un RAG sur contenus publiés/approuvés, pas un entraînement sur des données brutes. Il doit refuser d'inventer les informations absentes. Sans clé Mistral, il reste en mode réponse sûre fondée sur les sources trouvées.
- La relance panier requiert une case de consentement distincte du newsletter. Les liens sont signés, les sessions sont hachées, les envois sont idempotents et plafonnés. Le dispositif reste inactif sans activation admin et secrets Resend/cron.
