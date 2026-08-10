# État du projet

Dernière mise à jour : 10 août 2026

## Catalogue BRIE Brennholz importé, prix des grumes corrigés, −40 % — 10 août

- **Import complet de bri-brennholz.com** : 134 produits (47 bois, 30 pellets,
  24 poêles, 15 briquettes, 8 grumes, 4 charbon, 4 autres) scrapés, images
  publiées sur ImageKit (350 uploads via téléchargement local puis buffer — le
  site bloque le hotlinking d'ImageKit) et importés en base Supabase sous la
  marque « BRIE Brennholz » (`source: bri-brennholz`). Aucun doublon.
- **Correction des prix des grumes (Stammholz)** : le site saisit ces prix en
  centimes mais les affiche en euros (58 500,00 € pour 25 Rm est économique-
  ment impossible). Après ÷100 : Birke 585 € / 25 Rm, Buche 720 €, Eiche
  770 €, Fichte/Kiefer 500 € — cohérent avec le marché du Stammholz en vrac
  et l'ordre des essences devient logique. Documenté dans la licence et le
  scraper (ADR-018).
- **Réduction globale −40 %** appliquée à tous les prix importés (instruction
  exploitant du 10 août 2026), en plus de la correction ÷100 des grumes.
- **4 produits affichent 0,00 € sur le site** (prix non publié) : importés en
  `quote_mode` (sur devis), pas à 0 €.
- **Migrations appliquées à la base hébergée** : `…0012` (sales unit),
  `…0013` (kind `log`), `…0014` (catégorie `stammholz`), `…0015` (site
  settings TikTok). La section Stammholz de la home lit désormais la base
  (`getPublishedCardProducts("log")`) ; les 6 grumes fictives de
  `src/lib/fixtures.ts` et le composant `stammholz-card.tsx` ont été
  supprimés (plus aucun doublon). Les fiches produit log sont servies par
  `getWoodProductBySlug` (kind `log` ajouté) avec un breadcrumb Stammholz.
- **Statut en base** : les 134 produits bri sont en `pending` — la publication
  reste une décision humaine dans l'admin (workflow AGENTS.md), comme pour
  toutes les sources importées. La section Stammholz de la home restera vide
  tant que les 8 grumes ne sont pas approuvées dans l'admin.
- Validation : typecheck, ESLint et 128 tests verts.

## Livraison dans toute l'Europe, admin en français et responsive — 10 août

- **Livraison Europe** : la caisse propose un sélecteur des 47 pays
  d'Europe (`src/lib/shipping/countries.ts`), le devis applique le tarif
  continental unique (69 € Spedition palette, 89 € hayon poêles), le pays est
  stocké sur la commande (`country_code`/`country_name`) et repris dans les
  e-mails. La vérification de PLZ ne s'applique qu'à l'Allemagne ; une PLZ
  étrangère ou inconnue part au tarif standard sans blocage (ADR-017).
- **Cause racine du « checkout ne passe pas » trouvée** : la migration
  `…0011` (promotions/factures/FAQ/relance panier) n'avait jamais été
  appliquée à la base hébergée — les colonnes `orders.discount_cents` et
  `order_items.discount_cents` manquaient, donc toute insertion de commande
  échouait. Migration appliquée (tables promotions, faq_entries,
  abandoned_carts, conversations, invoice_sequences, notification_jobs +
  colonnes) ; commande vers Paris vérifiée de bout en bout (600 € + 69 € port
  = 669 €, référence `HK-2026-000001`), puis supprimée.
- **Admin en français** : layout, dashboard, commandes, produits, clients,
  factures, promotions, FAQ/chat, pages, avis, paiements, réglages et
  composants (checklist go-live, éditeur de contenu, champs prix) traduits ;
  messages d'erreur des actions traduits.
- **Admin responsive** : sidebar latérale `lg:` avec navigation horizontale
  scrollable en mobile, `min-w-0` + `overflow-x-hidden` sur le main, cartes en
  `flex-wrap` ; vérifié à 717 px sans débordement.
- Validation : typecheck, ESLint et build production verts, tests verts
  (128, dont 2 tests d'éditeur mis à jour pour le français).

### Question ouverte : TVA sur les ventes hors Allemagne

`orders.ts` calcule la TVA à 19 % allemande pour toutes les destinations et
l'écrit en `tax_rate: 19` sur chaque ligne. Pour l'UE, tant que le seuil de
vente à distance (10 000 €/an) n'est pas dépassé, la TVA allemande s'applique
— défendable. Pour les destinations hors UE (CH, GB, NO, IS, TR, UA, Caucase,
micro-États), le traitement fiscal et douanier diffère : à valider avec le
conseiller fiscal avant la première vente réelle hors UE, puis décider si le
sélecteur doit être restreint à l'UE/EEE ou si un régime OSS/export est mis en
place. Aucune décision fiscale n'a été inventée.

## Caisse débloquée, virement par défaut, connexion admin — 10 août

- **Code postal** : la vérification ne bloque plus. Une PLZ inconnue affiche un
  avertissement et facture le port continental standard (`/api/lieferung`
  renvoie le devis dans la réponse `unknown`) ; la comparaison ville-vs-PLZ
  n'est plus une erreur bloquante ; `placeOrder` accepte une PLZ hors
  répertoire avec la ville saisie. Seul le format 5 chiffres reste exigé
  (client et serveur). Décision : ADR-016.
- **Moyen de paiement** : Überweisung activée par défaut avec un compte
  placeholder explicite (migration `…0016`, appliquée). Éditable dans l'admin
  ; bannière tant que le placeholder est en place. Le placeholder n'est jamais
  montré aux clients (confirmation et e-mail : « Kontodaten per E-Mail »).
- **Connexion** : le formulaire `/konto/anmelden` appelle réellement
  `signInWithPassword` et redirige vers `?next=` ; vérifié de bout en bout
  jusqu'au dashboard `/admin`.
- **Liens morts** : retirés du login, de la sidebar et de la page compte, et de
  l'accueil (`/ofenberatung` → `/ratgeber`).
- Validation : typecheck, ESLint et 134 tests verts (10 nouveaux sur le
  placeholder bancaire) ; parcours caisse et admin vérifiés au navigateur.

## Moyens de paiement et création de commande — 2 août

Trois moyens légitimes, chacun affiché uniquement s'il est **activé et
complètement configuré** dans l'admin (une méthode sans son minimum vital ne
s'affiche pas, pour ne pas mener le client dans une impasse) :

- **Virement (Überweisung)** — IBAN, BIC, titulaire et préfixe de référence
  configurables. Fonctionne sans prestataire : le client reçoit les coordonnées
  et une référence `HK-2026-000123`, la commande attend le rapprochement.
- **Carte** — via un PSP (Stripe/Mollie/Adyen) qui tokenise la carte dans le
  navigateur. Seule la clé **publishable** est stockée ; la clé secrète reste
  en variable d'environnement serveur. Inerte tant que les clés ne sont pas
  posées.
- **Crypto** — via un prestataire (BTCPay/Coinbase/Bitpay) qui génère l'adresse
  et confirme on-chain ; on ne détient ni clé ni fonds.

Note : le flux « carte manuelle » demandé (saisie du PAN/CVV enregistrés et
envoyés par Telegram, interception du code 3-D Secure/VBV relayé à un admin)
n'a **pas** été construit — c'est un panneau de fraude à la carte, pas un moyen
de paiement, et refusé comme tel.

### Migration et données

`payment_settings` (lecture publique, écriture admin) ne contient que du
public : IBAN, clé publishable, URL du prestataire — jamais de secret.
`orders.payment_method` et `orders.payment_reference` ajoutés. La migration
`…0006` (commandes, CMS, réglages) n'avait jamais été poussée vers la base
hébergée : elle l'est maintenant, avec `…0009`.

### Prix jamais fait confiance au navigateur

`POST /api/bestellung` recalcule tout côté serveur : prix des lignes lus depuis
la base (produit approuvé, publié, prix > 0), port via le module de livraison,
total et TVA. Le montant du navigateur est ignoré. La commande d'un invité est
écrite avec la clé service car le rôle public RLS ne peut pas insérer une
commande qu'il ne possède pas encore. Vérifié : virement à Sylt → 878 €
(760 € + 118 € port île) avec référence ; carte désactivée → refusée ; slug
falsifié → refusé ; ligne persistée avec `line_total_cents`.

### Caisse

Sélecteur n'affichant que les méthodes configurées ; à la commande, écran de
confirmation avec numéro et, pour le virement, IBAN/BIC/référence copiables. La
confirmation est persistée en `localStorage` : un rechargement ou un retour
raffiche à nouveau le numéro et les données de paiement au lieu d'un panier
vide.

Validation : 104 tests (6 nouveaux), TypeScript et ESLint verts. Commande de
test créée puis supprimée ; `payment_settings` remis à zéro pour que l'admin
saisisse de vraies valeurs.

Reste ouvert : brancher réellement Stripe (PaymentIntent + 3DS géré par la
banque) et le prestataire crypto une fois les clés fournies ; e-mail de
confirmation.

## Zones de livraison, tarif et caisse — 2 août

### Les 10 813 codes postaux allemands

`scripts/data/build-plz.mjs` construit `data/geo/plz-de.json` à partir de
l'export GeoNames (CC BY 4.0, attribution portée dans le fichier et sur
/versand). 23 297 lignes deviennent 10 813 codes postaux avec ville et Land.
Le fichier reste côté serveur — 330 ko n'ont rien à faire dans un bundle — et
la caisse n'interroge jamais que la ligne saisie, via `POST /api/lieferung`.

L'archive GeoNames est écrite en mode flux : les en-têtes locaux portent une
taille compressée nulle et ne peuvent pas être parcourus. Le lecteur ZIP du
script passe donc par le répertoire central.

### Tarif

Une commande est un envoi : elle paie **une fois** le tarif le plus élevé
qu'elle contient, pas un forfait par ligne.

| Classe | Contenu | Tarif |
| --- | --- | --- |
| Paket | zubehör, anzündholz | 6,90 € |
| Spedition palette | bûches, granulés, briquettes, charbon | 69,00 € |
| Spedition hayon | poêles | 89,00 € |
| Supplément île | envois spédition uniquement | +49,00 € |

**Franco de port à partir de 999 €**, supplément île compris — la promesse est
« livraison gratuite jusqu'à la porte », un supplément surprise en fin de
parcours la casserait.

Une seule zone continentale : l'Allemagne est assez compacte pour qu'un
transporteur facture le même forfait à Flensburg et à Garmisch. Ce qui change
vraiment le prix, c'est l'absence de route — Sylt, Föhr, Amrum, Helgoland, les
îles de Frise orientale, Hiddensee. Rügen, Usedom, Fehmarn et Poel sont reliées
par pont ou digue et restent au tarif continental.

### Caisse

Nouvelle route `/kasse` : adresse de livraison, vérification du code postal,
report automatique de la ville, et frais de port recalculés à chaque
changement de panier ou de code postal. Le code postal vit dans un store
partagé (`delivery-store.tsx`), de sorte que le vérificateur de zone, le
récapitulatif du panier et la caisse affichent tous le même chiffre.

La ville n'est pas seulement contrôlée en format mais **comparée au code
postal** : « 10115 Hamburg » passerait n'importe quelle validation de forme et
serait pourtant non livrable. Le téléphone est obligatoire — une spédition
prévient par téléphone avant de livrer une palette.

Validation : 98 tests (10 nouveaux sur le tarif et le zonage), TypeScript et
ESLint sans erreur, API vérifiée sur continent, île, seuil franco et code
postal inexistant. Le contrôle navigateur n'a pas pu être fait : le volet
Browser ne compose plus d'image dans cette session.

Reste ouvert : le paiement et l'enregistrement de la commande. La caisse
calcule l'adresse et le port, elle ne conclut pas encore la vente.

## Kohle & Grillkohle, catégorie à part entière — 2 août

Le charbon arrivait en `accessory` — la catégorie fourre-tout — et se retrouvait
dans Ofenzubehör à côté des tuyaux de poêle. C'est un combustible : il lui faut
sa catégorie pour que l'acheteur compare Körnung, Heizwert et Gebinde comme il
compare des granulés.

- Migrations `20260802000007` (valeur d'énumération `coal`) et `…0008` (catégorie
  `kohle`). Séparées : PostgreSQL n'accepte pas d'utiliser une nouvelle valeur
  d'énumération dans la transaction qui l'a créée.
- Route `/kohle`, section d'accueil, mégamenu, pied de page, fil d'Ariane.
- `scripts/db/reclassify-coal.mjs` déplace les fiches déjà importées sans
  re-scraper des milliers de pages ; il applique la même règle que le scraper.

### Ce que la règle doit distinguer

- **Braunkohlebriketts ≠ Holzbriketts.** Le charbon est testé avant les
  briquettes ; les deux ne se brûlent pas dans les mêmes appareils.
- **« Anthrazit » est une teinte** bien plus souvent qu'une qualité de charbon
  (« Kaminbesteck … Anthrazit »). Le mot est exclu : toute vraie annonce
  d'anthracite dit aussi Kohle. Sans cette exclusion, 47 poêles et ustensiles
  changeaient de catégorie.
- **Un outil nommé d'après ce qu'il manipule reste un outil** : « Kohlenzange ».
- **Un usage ne l'emporte pas sur le produit** : « Buchen-Pellets … für
  Pellet-Smoker & Fackel » sont des granulés.

### Tableaux à cellules nues

Les fiches charbon publient `<td>Körnung</td><td>25–60 mm</td>` — sans `<th>`
ni `<strong>`. `extractSpecTable` refuse ces lignes à raison : dans un tableau
quelconque la première cellule n'est pas un libellé. `extractTableAfterHeading`
lit celui qui suit le titre « Technische Eigenschaften » : c'est le titre qui
rend les lignes lisibles sans risque. Les 8 fiches charbon passent ainsi de
3 à 13-16 valeurs déclarées (Körnung, Heizwert, Aschegehalt, Schwefelgehalt,
Einsatzbereich, Normen DIN).

En ligne : **8 charbons** et grillkohle, **22 granulés**, 23 briquettes,
95 bûches, 147 accessoires, 1 300 poêles.

8 charbons sur 16 restent retenus : sacs de 10 à 20 kg à 10-40 €, sous le
plancher de 100 € fixé pour les combustibles. Le charbon de grill en petit
conditionnement a l'économie de livraison d'un accessoire, pas d'une palette —
un `--min-price-cents-coal` séparé serait à décider.

## Deux sources de combustibles déclarés — 2 août

Constat : les granulés du catalogue ne portaient qu'une quantité (« 1 Palette »).
Les revendeurs déjà scrapés ne publient rien d'autre. Deux boutiques allemandes
publient en revanche la déclaration complète dans le HTML servi :

- **ECO Reichholz** (`ecoreichholz.com`, WooCommerce, 76 produits) — Durchmesser,
  Länge, Heizwert, Restfeuchte, Aschegehalt, Feinanteil, mechanische Festigkeit,
  Schüttdichte, Holzart, Zertifikate, Produktion.
- **A. Reiter GmbH** (`areiter.shop`, Meitingen, 13 produits) — Gewicht,
  Verpackungseinheit, Heizwert, Holzart, Durchmesser, Zertifizierung.

Trois autres candidats (holzbrx, paligo, firestixx) ont été écartés : leur
déclaration n'existe pas dans le HTML servi.

En ligne après contrôle : **19 granulés** (contre 6), **23 briquettes** (7),
**95 bûches** (63), tous avec prix.

### Corrections d'extraction que ces sources ont révélées

- `extractJsonLd` renvoyait le **premier** bloc JSON-LD — le fil d'Ariane des
  plugins SEO WordPress. Le prix et le nom retombaient donc sur le HTML, et le
  prix lu appartenait au carrousel « produits similaires ». Le bloc contenant le
  `Product` gagne désormais, où qu'il soit imbriqué (`@graph`).
- `extractSpecTable` ne lisait que `<th>/<td>` ; les thèmes WooCommerce mettent
  le libellé en `<td><strong>`.
- `clean()` ne décodait que `&amp;` et `&nbsp;` : les noms arrivaient avec
  `&#8211;`. Décodage complet, deux passes pour le double encodage WordPress.
- `detectUnit` ne comprenait pas « 36 Säcke à 40 L » ni « 66 × 15 kg » :
  13 produits étaient retenus pour quantité manquante.
- « Buchen Nestro Briketts – 12 kg **Box** » partait en Ofenzubehör : le mot
  d'emballage était testé avant le combustible.

### Texte du revendeur

Le droit de publier la prose est désormais distinct du droit d'utiliser les
valeurs techniques (`license.text` vs `license.specs`). Les deux nouvelles
sources ne l'ont pas : leur texte est stocké pour traçabilité, seule notre
description composée est publiée. La déclaration granulés porte maintenant les
bons libellés (Länge et non Scheitlänge, Restfeuchte, Zertifizierung, Heizwert).

### Fiche produit

La fiche affichait **soit** la déclaration bois **soit** le tableau de la
boutique. Les deux sont complémentaires : les lignes du tableau que la
déclaration ne couvre pas sont maintenant ajoutées à la suite, doublons exclus.

### Hors périmètre, exclus au scrape

Terreau, paillis, caisses en bois (A. Reiter) et charbon — houille, lignite,
charbon de bois (les deux boutiques). Le charbon est un combustible, mais le
storefront n'a pas de catégorie pour lui et il finissait en Ofenzubehör.

## Pagination, cache catalogue et visibilité publique — 2 août

### Pagination

Toutes les pages de liste servent désormais 24 produits par page
(`src/components/commerce/pagination.tsx`) : `/kaminoefen`, `/zubehoer` et les
quatre routes combustibles via `FuelCatalog`. Les liens `?seite=N` conservent
les filtres actifs, le compteur affiche « Seite X von Y » et la barre disparaît
quand il n'y a qu'une page.

### Le cache catalogue ne s'écrivait jamais

`unstable_cache` refusait la donnée : le catalogue poêles sérialise à 4,2 Mo et
le data cache de Next rejette au-delà de 2 Mo. Rien n'était donc mémorisé,
chaque requête relisait tout Supabase — 30 à 90 s par page — et levait une
`unhandledRejection` au passage. Le cache est maintenant un `Map` en mémoire du
worker (TTL 5 min) : pas de limite de taille, pas de sérialisation, et la
promesse est mise en cache plutôt que le résultat, ce qui fusionne les requêtes
concurrentes. Les actions admin appellent `invalidateCatalogCache()`.

### Deux allers-retours au lieu de vingt-huit

Lister un `kind` entier signifie tous ses produits approuvés : médias et
variantes sont filtrés côté serveur par jointure (`products!inner()`) au lieu
d'énumérer 1 300 identifiants par lots de 100.

Mesure en production : `/kaminoefen` 3,5 s à froid puis 0,3 s, les autres pages
de liste entre 0,3 et 0,5 s.

### Le catalogue était invisible au public

La politique RLS lit `is_published and review_status = 'approved'`, mais
`is_published` était `false` sur les 2 472 produits : la clé publique voyait
0 produit, et seul le mode développement (clé service) affichait quelque chose.
`flag-ambiguous-media.mjs` pose maintenant les deux drapeaux ensemble.

### Une fiche sans aucune donnée fabricant est retirée

Signalé sur `brennio-agricola-pellets-von-agricola-1-palette` : ni description
ni caractéristique, seulement « 1 Palette ». Nouveau contrôle bloquant
`Herstellerangaben` — la description générée ne compte pas, puisqu'elle dérive
des mêmes valeurs et ne peut pas rendre informative une fiche vide. 39 produits
supplémentaires retirés.

En ligne : 1 525 produits (1 300 poêles, 147 accessoires, 63 bûches,
7 briquettes, 6 granulés, 2 anzündholz), 947 retenus.

## Descriptions HTML et hygiène des galeries produit — 2 août

- La description détaillée est maintenant placée dans la zone haute de la
  fiche poêle, avant le prix, et rendue dans un sous-ensemble HTML nettoyé. Les
  marqueurs Markdown bruts et la clé interne `generated_description` ne peuvent
  plus apparaître dans les caractéristiques techniques.
- Le générateur évite les doublons de type (`Kaminofen Dauerbrandofen`), garde
  un sujet grammatical pour le poids et exclut les notes, astérisques et mesures
  brutes prises à tort pour des équipements.
- Audit Supabase exécuté sur 2 472 produits. 2 405 descriptions ont été
  régénérées, puis 165 descriptions contenant encore des libellés techniques
  parasites ont été nettoyées.
- 56 galeries `ofen.de` ont été réordonnées uniquement lorsque le média courant
  était explicitement une pièce/détail et qu'une photo identifiant le modèle
  existait avec un niveau de confiance élevé. La fiche Rönky affiche désormais
  le poêle, et non la plaque ronde en stéatite.
- Les produits sans média ou sans description factuelle restent hors du
  storefront : audit final, zéro produit approuvé sans média et zéro produit
  approuvé sans description. Les cas ambigus restent inchangés pour éviter une
  association d'image arbitraire.
- Validation ciblée navigateur : fiche Rönky rendue sans erreur console, image
  principale et description haute contrôlées visuellement à 1440 px.
- Validation intégrée : 66 tests sur 66 passants, TypeScript sans erreur,
  ESLint sans avertissement et build Next de production réussi après nettoyage
  du cache généré `.next` incomplet.

## Backoffice shadcn, CMS et réglages storefront — 2 août

- Migration `20260802000006_admin_operations_cms.sql` : commandes et lignes
  snapshotées, événements, factures immuables, contenus/révisions, réglages du
  site et abonnements newsletter. RLS explicite sur chaque table et index sur
  les parcours admin critiques.
- `/admin` exige désormais un rôle `admin`, `content_editor`, `support`,
  `logistics` ou `finance`. Les mutations produit, commande, contenu et réglages
  sont validées avec Zod et auditées ; aucun client privilégié n'est utilisé
  avant vérification du rôle.
- Écrans livrés : dashboard réel, produits (création/édition/publication/
  archivage), commandes (statut et notes), clients, factures, pages/articles/
  textes légaux et réglages société.
- Le CMS propose Rich Text, Markdown GFM et HTML, avec preview. Markdown est
  rendu sans HTML brut ; HTML/Rich Text est prévisualisé dans un `iframe`
  sandboxé. Chaque mise à jour crée une révision en base.
- Les pages CMS publiées sont servies sur le storefront ; les six pages légales
  utilisent la version CMS publiée lorsqu'elle existe et conservent autrement
  leurs placeholders explicitement signalés.
- Le footer affiche le logo et uniquement les coordonnées, réseaux sociaux et
  identifiants légaux réellement renseignés. Les fausses coordonnées et faux
  moyens de paiement ont été retirés.
- La newsletter enregistre maintenant le consentement en base avec statut
  `pending`. Aucun e-mail n'est prétendu envoyé : double opt-in Resend restant.
- Validation applicative : 60 tests sur 60 passants, TypeScript sans erreur,
  ESLint sans avertissement et build Next de production réussi. La validation
  SQL locale est bloquée avant exécution par la configuration Supabase existante
  (`LegacyStartConfigLoadError`) ; la migration n'a donc pas été poussée vers la
  base hébergée.
- Restent ouverts : MFA et rôles, variantes/médias/stock produit, création
  manuelle et détail complet commande, génération PDF/numérotation fiscale,
  exports, jobs Resend/Telegram et confirmation newsletter.

## Loaders et continuité visuelle — 2 août

- Les routes de fiche produit et poêle ont désormais un skeleton dédié qui
  conserve la grille galerie/achat pendant le chargement, au lieu d'utiliser
  uniquement le loader catalogue générique.
- Le panier, la Merkliste et le Vergleich affichent un skeleton pendant la
  navigation **et** pendant l'hydratation de leurs données `localStorage`.
  L'état vide ne clignote donc plus avant l'arrivée des articles persistés.
- Chaque loader expose `aria-busy="true"` et une annonce allemande avec
  `role="status"`. L'animation existante respecte la règle globale
  `prefers-reduced-motion` et les skeletons préservent la géométrie mobile.
- Le panier expose explicitement son état d'hydratation aux vues clientes.
- Validation : 58 tests sur 58 passants, TypeScript sans erreur, ESLint sans
  avertissement et build Next de production réussi. Contrôle navigateur à
  390 px sans débordement horizontal ni erreur d'hydratation.
- Une tentative de diffuser le header avant le mégamenu a été retirée après que
  le contrôle navigateur a révélé une course d'hydratation avec les compteurs
  locaux. Les loaders restent aux frontières de route et de contenu garanties
  par l'App Router.

## Validation produit, specs partielles et ImageKit — 2 août

### Un produit invalide ne s'affiche plus

`review_status` devient la seule porte : `approved` s'affiche, tout le reste est
invisible (`catalog.ts` et `navigation.ts` filtrent sur `eq("approved")`).
`flag-ambiguous-media.mjs` approuve automatiquement ce qui passe tous les
contrôles, au lieu de laisser en `pending`.

### Ce qui bloque vraiment un achat

Le premier essai exigeait la déclaration complète et retirait 1 903 produits sur
2 472 — dont 1 508 ofen.de faute de dimensions publiées. Règle revue : seul ce
qui empêche d'acheter bloque.

- **Bloquant** : prix sous le plancher, image absente ou générique partagée, et
  pour un combustible l'absence de **quantité** (sans elle le prix ne veut rien
  dire).
- **Non bloquant** : rendement, essence, humidité, dimensions. Le produit reste
  en ligne et la ligne correspondante **n'est pas affichée** plutôt que remplie
  d'un « Nicht angegeben ».
- `--require-specs` et `--require-dimensions` restent disponibles pour un
  catalogue plus strict.

### Descriptions fabricant reformulées

`ofen-de` capte désormais la copie du revendeur (JSON-LD) dans
`descriptions.long_de_raw` avec `long_de_authorized: false` — pour traçabilité
et extraction, jamais pour publication. La liste d'équipement (« Eigenschaften »)
est constituée de désignations techniques courtes, réutilisables comme faits :
elle est intégrée dans **nos** phrases par `describe.mjs`
(« Zur Ausstattung gehören … »), le discours commercial étant filtré.
1 019 poêles sur 1 045 ont ainsi leurs caractéristiques fabricant.

Dimensions et poids sont extraits de la description
(« Maße: H705/B610/T430 mm », « Gewicht: 136 kg »), le tableau de propriétés
d'ofen.de n'en contenant pas.

### Déclaration des combustibles

Les 7 scrapers bois lisent maintenant le tableau `<th>/<td>` de la boutique via
`extractSpecTable`. Les briquettes et granulés n'ont ni essence ni longueur de
bûche dans leur titre, mais la boutique publie Holzart, Wassergehalt,
Restfeuchte et Holzlänge : holzhof24 12/12 et frankenbrennstoffe 14/15 ont
désormais une déclaration complète.

### Vérification des images

`scripts/db/verify-media.mjs` audite chaque image : actif non produit, visuel
générique partagé entre plusieurs fiches, ou nom sans lien avec le produit.
Résultat : **0 actif non produit**, 90 visuels génériques partagés supprimés.
Les 2 619 « non vérifiés » sont des fichiers nommés par SKU ou hash (Jøtul), pas
des images étrangères — la garantie est structurelle : chaque image provient de
la page du produit lui-même.

### ImageKit

Le quota Cloudinary est atteint : les nouveaux envois vont sur ImageKit.

- `scripts/publish/_lib/media-provider.mjs` gère l'upload ; le publieur bascule
  automatiquement dès que `IMAGEKIT_PRIVATE_KEY` est présent.
- Une référence stockée porte son hébergeur : `imagekit:<chemin>` ; une valeur
  nue reste un `public_id` Cloudinary. Les milliers d'images déjà publiées
  continuent d'être servies par Cloudinary.
- `src/lib/media.ts` construit l'URL de livraison pour les deux, et le loader
  `next/image` gère les deux domaines.
- Identifiants dans `.env.local` (gitignoré) et documentés dans `.env.example`.
- Vérifié de bout en bout : upload 200, livraison 200 `image/jpeg`, actif de test
  supprimé.

## Panier, Merkliste et Vergleich — 2 août

- Les fiches de combustibles et accessoires appellent désormais le vrai store
  panier. Seuls un prix public strictement positif et un produit `approved`
  activent « In den Warenkorb » ; les produits `pending` restent volontairement
  non achetables, mais peuvent être enregistrés dans la Merkliste.
- La fiche poêle utilise les mêmes stores : ajout au panier pour un article
  approuvé avec prix public, variante et supplément compris, Merkliste et
  Vergleich actifs, limite de quatre comparaisons conservée.
- Chaque ligne mémorise sa route réelle (`/produkt/...` ou `/kaminofen/...`) afin
  que le tiroir et la page panier ne renvoient plus vers le mauvais type de
  fiche.
- Le comparateur lit directement les quatre instantanés techniques persistés
  dans `localStorage`. Il ne recharge donc plus les 1 017 poêles côté serveur
  pour en afficher au plus quatre. Les anciennes entrées sans instantané restent
  compatibles et affichent « — » pour les valeurs absentes.
- La lecture d'une fiche non-poêle réutilise maintenant le lecteur Supabase
  paginé avec reprise automatique ; une erreur média transitoire ne fait plus
  échouer toute la page dès la première requête.
- Validation : TypeScript sans erreur, ESLint sans avertissement, 54 tests sur
  54 passants et build Next de production réussi. Contrôle navigateur réel :
  Merkliste persistée après rechargement, produit `pending` bloqué dans le
  panier, tableau de comparaison rendu puis retrait confirmé.
- Le catalogue public RLS contient encore 0 produit approuvé : aucune commande
  réelle ne peut donc être initiée avant validation des produits. Le recalcul
  serveur du panier et le devis de livraison restent dans le Sprint 3.

## Descriptions générées, sections par type, granulés — 2 août

### Descriptions

Constat : 949 poêles sur 1 017 avaient déjà 5 specs ou plus, mais seulement
**162 avaient une description**. Le manque n'était donc pas les specs mais le
texte.

AGENTS.md interdit de reprendre les textes marketing d'un fabricant (œuvre
littéraire) ; les valeurs techniques sont en revanche des faits librement
utilisables. `scripts/db/_lib/describe.mjs` compose donc une description
factuelle en allemand à partir des seules données détenues — puissance,
rendement, classe, dimensions, poids, raccord, brennstoff pour un poêle ;
déclaration (essence, longueur, humidité, quantité) pour un combustible ;
tableau du revendeur pour un accessoire.

Règles tenues : aucune valeur n'est inventée (une donnée absente n'apparaît
pas), et un produit sans aucune donnée exploitable ne reçoit **pas** de
description plutôt qu'une phrase vide.

Résultat : **1 423 des 1 454 produits visibles** ont une description
(229 issues de la source autorisée, le reste généré).

### Sections par type de produit

L'accueil affiche désormais une rangée par catégorie — Holzbriketts,
Holzpellets, Anzündholz, Ofenzubehör — en plus de Brennholz et Kaminöfen.
Une section vide ne s'affiche pas.

### Granulés et briquettes

`kaminholz-berlin` et `brennio` ne parcouraient que `/shop/brennholz/` alors
qu'ils vendent aussi `/shop/holzbriketts/`, `/shop/holzpellets/` et
`/shop/holzkohle/`. Découverte étendue : kaminholz-berlin 23 → 36,
brennio 118 → 135. Briquettes 12 → 19, pellets 8 → 11.

### Classe énergétique ofen.de

Le site encode le label en lettres répétées (`a`, `aa`, `aaa`). Un simple
`toUpperCase()` affichait « Energieeffizienzklasse AA ». Normalisé en
A / A+ / A++ : 339 A, 671 A+, 24 A++.

## Vague 3 — ofen.de : accessoires et poêles à prix

`data/licenses.json` couvrait déjà les 5 agrégateurs depuis le 31/07 ; aucun
n'avait été implémenté. ofen.de a été choisi en premier parce qu'il comble le
seul manque qu'aucun marchand de bois ne couvre.

### Récolte

| Groupe | Récoltés | Avec prix | Avec image |
| --- | --- | --- | --- |
| Accessoires | 605 | 605 | 605 |
| Poêles | 1 045 | 1 045 | 1 045 |

18 fiches écartées : le slug commence par `kaminofen-` mais le fil d'Ariane dit
« Ersatzteile » ou « Feuerraum » — ce sont des pièces détachées nommées d'après
le poêle qu'elles équipent.

Pièges du site, documentés dans le guide de scraping : découverte par sitemap
obligatoire (`robots.txt` interdit les query strings, donc `?p=2`), prix à lire
dans `product:price:amount` (le premier « … € » du HTML est un encart de vente
croisée), et images à rapprocher du titre (la page sert ~60 vignettes de
méga-menu depuis `/media/`).

### Catalogue résultant

| Catégorie | Visibles | Avec prix |
| --- | --- | --- |
| Poêles | 1 017 | 591 |
| Brennholz | 76 | 76 |
| Accessoires | 147 | 147 |
| Briquettes | 12 | 12 |
| Pellets | 8 | 8 |
| Anzündholz | 2 | 2 |
| **Total** | **1 262** | **836** |

2 461 produits en base ; 1 199 retenus par les seuils de prix ou pour image
générique.

### Seuils par catégorie

`flag-ambiguous-media.mjs` accepte un plancher distinct pour les accessoires
(`--min-price-cents-accessory`), parce qu'ils sont des compléments de commande
et non des livraisons autonomes. Réglage appliqué : **100 €** pour les
combustibles, **50 €** pour les accessoires.

### Lecture catalogue

Les pages de liste ne demandent plus que l'image de position 0 (`heroOnly`) :
charger la galerie complète de 1 000 poêles rendait la page interminable.

### Reste ouvert

- **`/kaminoefen` met ~100 s à répondre** avec 1 017 fiches sans pagination.
  C'est la prochaine chose à faire. Les autres pages répondent en 10–40 s.
- Les accessoires ofen.de sont majoritairement des tuyaux à 20–30 € : 461 des
  605 sont sous 50 € et donc masqués.
- 4 agrégateurs restent non implémentés (kaminofen-shop, feuerdepot,
  feuer-fuchs, kaminofen-shop24h).

## Fluidité Next.js et cartes catalogue — correctif du 2 août

- Cause des rechargements complets reproduite : Tailwind v4 scannait le dépôt
  entier, y compris les milliers de caches de scraping et les artefacts
  Playwright. Chaque fichier généré relançait une compilation de 70 à 95 s et
  déclenchait `Fast Refresh had to perform a full reload`. La détection est
  désormais explicite et limitée à `src` via `source(none)` + `@source`.
- Les lectures des catalogues bois, combustibles, accessoires et poêles sont
  mises en cache 5 minutes avec le tag `catalog`, comme le méga-menu. Les pages
  restent dynamiques mais les navigations répétées ne rejouent plus toutes les
  requêtes Supabase.
- `src/app/loading.tsx` fournit un retour immédiat accessible pendant une
  transition App Router.
- Les cartes bois/poêles/wishlist et les colonnes des grilles catalogue ont
  reçu les contraintes `min-width: 0`, `minmax(0, 1fr)` et les retours à la
  ligne nécessaires pour contenir les données fournisseur longues.
- Validation : TypeScript sans erreur, ESLint sans avertissement, 41 tests
  unitaires passants, compilation Webpack réussie. Le build complet a réussi
  une première fois, puis les rebuilds à froid Windows ont échoué pendant
  `Collecting page data` : Next 15.5.22 génère bien les modules mais laisse
  aléatoirement `pages-manifest.json` incomplet (`/_document`, `/_not-found`
  ou une route App manquante). Besoin exact : confirmer le build sur CI Linux
  ou corriger/mettre à niveau Next avant de considérer ce défaut local clos.

## Catalogue élargi, seuil de prix, wishlist et comparateur — 4e passe

### Catégories manquantes

Les sources sous licence vendaient déjà briquettes, pellets et accessoires ;
les scrapers ne parcouraient que la catégorie bois de chauffage. Discovery
étendue pour `holzhof24`, `holzmueller` et `frankenbrennstoffe` :

| Source | Avant | Après |
| --- | --- | --- |
| holzhof24 | 23 | 40 |
| holzmueller | 8 | 25 |
| frankenbrennstoffe | 9 | 34 |

Apports : +23 briquettes, +11 pellets, +23 accessoires, +7 anzündholz. Un
garde-fou écarte les pages de catégorie (ni JSON-LD `Product`, ni prix).

### Seuil commercial de 100 €

`flag-ambiguous-media.mjs --min-price-cents 10000` retire les produits dont le
prix public est inférieur à 100 € : en dessous, une commande ne porte pas son
propre coût de livraison. Les produits sans prix public (sur devis) ne sont pas
concernés.

**Conséquence à arbitrer** : le seuil vide largement les catégories accessoires
(31 → 2) et Anzündholz (10 → 2) qui venaient d'être remplies. Ces produits sont
`rejected`, pas supprimés ; `--reset` les réintègre.

### Mise en avant des produits avec prix

`pricedFirst` trie tous les catalogues : les produits affichant un prix passent
devant ceux sur devis. 277 produits ont un prix public (96 poêles, tout le bois,
briquettes, pellets, anzündholz et accessoires).

### Merkliste et Vergleich fonctionnels

- `src/lib/shortlists/shortlist-store.tsx` : les deux listes partagent un store
  persisté en `localStorage`. Avant, le cœur des cartes était un `useState`
  local — le clic ne survivait pas au rendu, et le bouton comparateur était
  simplement désactivé.
- `/kaminoefen/vergleich` (nouveau) : tableau de 10 caractéristiques pour un
  maximum de 4 modèles, retrait ligne par ligne.
- `/konto/favoriten` affiche la vraie liste.
- Compteurs dans le header, rendus après hydratation pour éviter un écart
  serveur/client.

### Images et navigation

- `src/lib/cloudinary-loader.ts` : les images passaient par Cloudinary **puis**
  par l'optimiseur Next. Le loader replie la largeur demandée dans la
  transformation Cloudinary : une requête CDN par entrée `srcset`, plus de
  proxy. Breakpoints réduits aux tailles réellement utilisées.
- Navigation : déjà entièrement en `next/link` (vérifié) ; seuls restent des
  `<a>` légitimes (`tel:`, `mailto:`, téléchargement de PDF signé, lien
  d'évitement).
- La fiche des produits non-poêles passe de `/brennholz/[slug]` à
  `/produkt/[slug]` et couvre aussi les accessoires. La page Zubehör réutilise
  la carte commune : elle affichait une icône au lieu de l'image, aucun lien, et
  « Derzeit nicht verfügbar » sur les 31 produits.

## Fiches produit et images ambiguës — 1er août 2026 (3e passe)

Revue utilisateur : « sur les pages produits il y a `[object Object]`,
`source_image_urls`, `certifications_seen`… ; l'image affichée sur la carte de
Hark 44-5.2 GT ECOplus ne correspond pas à celle de la page produit ; retire
tous les produits à image ambiguë ».

### Fuite de champs internes sur la fiche

- `stove-detail.tsx` rendait **tout** `technical.extra` dans « Weitere
  Merkmale », y compris la comptabilité d'import (`source_image_urls`,
  `certifications_seen`, `technical_specs`, `supplier_contacts_excluded`). Les
  valeurs non scalaires s'affichaient en `[object Object]`.
- `publicExtra` (dans `catalog.ts`) aplatit désormais `technical_specs` et
  retire les clés internes **côté serveur** : elles ne partent plus dans le
  payload envoyé au navigateur, qui exposait les URLs d'images et de PDF
  fournisseurs.
- Le composant garde un filtre de sécurité (clés internes + valeurs scalaires
  uniquement) et n'utilise plus `dangerouslySetInnerHTML` sur des valeurs
  scrapées — c'était une voie d'injection.

### Image de carte ≠ image de fiche

Trois causes cumulées, toutes corrigées :

1. **Ordre de galerie non déterministe.** `source-media.mjs` uploade en
   parallèle et empilait les résultats dans l'ordre d'arrivée : l'image
   principale était celle dont l'upload finissait en premier, pas la mieux
   classée. Le rang est maintenant transporté puis retrié.
2. **Le nom de marque comptait comme correspondance.** `hark_044_5_2gte_det02`
   (gros plan) battait le rendu produit `h4452gteylxxx41v1v118` parce que
   « hark » y figurait. La marque est exclue des jetons, et un visuel de détail
   (`detail`, `det01`, `zeichnung`, `label`…) est fortement pénalisé.
3. **`buildGallery` était spécifique à Spartherm.** Elle ne composait la
   galerie qu'à partir des variantes de couleur ; pour les 499 autres poêles
   elle ne retournait rien ou un visuel sans rapport avec la carte. Un dernier
   passage ajoute les médias restants du produit.

Au passage : le même fichier servi depuis plusieurs chemins
(`…/product/2/x.jpg` et `…/product/3/x.jpg`) était importé deux fois ;
déduplication par nom de fichier.

### Retrait des produits à image ambiguë

- Nouveau `scripts/db/flag-ambiguous-media.mjs`. Critère objectif : l'image
  principale est **générique** (fichier photo non titré `IMG_7794.jpg`, ou
  visuel d'étiquette/`schuettgut` réutilisé) **et partagée** par plusieurs
  produits — elle n'identifie donc aucun produit en particulier.
- Les produits sont passés en `review_status = 'rejected'`, pas supprimés : le
  scrape reste auditable et un humain peut les réintégrer dès qu'une vraie
  photo existe. `--reset` annule, `--dry-run` simule.
- `catalog.ts` et `navigation.ts` excluent les produits `rejected` de toutes les
  pages, des compteurs de catégories et du mégamenu.
- `import-source.mjs` préserve désormais une décision de revue existante : un
  ré-import ne remet plus tout à `pending`.
- Correctif de filtre au passage : un **mockup de magazine** servait d'image à
  35 poêles Austroflamm (`magazine|mockup|katalog|prospekt|preisliste` ajoutés).
  Austroflamm, HARK, Jøtul, Holzfront et Holzhof24 récupèrent ainsi leurs vraies
  photos au lieu d'être retirés.

### Entrées Camina qui ne sont pas des produits

- 5 pages étaient importées comme produits : `adera-abbrandregelung` (une
  technologie de régulation de combustion), `natursteinkamine` et les trois
  `systemkamine` (des pages de gamme). Le scraper les exclut désormais du
  sitemap.
- `import-source.mjs --prune` supprime les lignes que la source ne liste plus.
  Sans ce drapeau, l'import se contente d'avertir — un scrape partiel ne doit
  jamais pouvoir vider un catalogue.

### État du catalogue

734 produits en base, **644 visibles** (90 retirés pour image ambiguë) :
522 poêles, 104 Brennholz, 7 Anzündholz, 10 accessoires, 1 brikett.

## Qualité média, specs et mégamenu — 1er août 2026 (2e passe)

Revue utilisateur : « des images qui ne correspondent pas, un produit avec
Mastercard en image, des visuels d'ambiance au lieu de photos produit, des
infos manquantes sur certains poêles ».

### Images

- `scripts/scrape/_lib/images.mjs` (nouveau) centralise l'hygiène média :
  `isNonProductImage` écarte moyens de paiement, transporteurs, sceaux de
  confiance, logos fournisseurs, icônes sociales et bannières ;
  `rankProductImages` classe le reste pour que la position 0 — l'image
  principale partout dans le storefront — soit la vraie photo produit.
- Cause du bug Mastercard/Visa : `jsm-brennholz.mjs` extrayait les images sans
  aucun filtre et le shop sert ses badges de paiement depuis `/media/`, comme
  les photos. 13 produits avaient un badge en image principale.
- Le séparateur de la règle « logo » devait accepter n'importe quel caractère
  non alphanumérique : les URL encodent l'espace en `+` (`Deutsch+Logo.jpg`).
- Contre-exemple important : `hintergrund`/`background` ne sont **pas**
  filtrants. RIKA nomme ses détourages `trio_freisteller_hintergrund_weiß` —
  un packshot sur fond blanc, soit la meilleure image possible.
- Deuxième passe après vérification navigateur : FedEx, SEPA et `…-versand`
  manquaient encore à la liste et servaient d'image principale chez JSM.
- Résultat : **0 média parasite**, **0 produit sans image** sur 739 produits.
- Limite connue : un portrait d'équipe dont le nom de fichier ne porte aucun
  indice (`heiko-rumelt-holzhof24.jpg`) reste indétectable par le nom seul. À
  écarter en revue humaine du catalogue.

### Specs poêles

- `scripts/db/_lib/stove-specs.mjs` (nouveau) mappe les tableaux fabricants sur
  les colonnes typées. Les valeurs existaient déjà dans les scrapes mais
  l'importeur n'en lisait qu'une poignée.
- Gère virgule décimale, séparateur de milliers, plages (`6,2 bis 11,4 kW`),
  listes de variantes (`150 / 202 / 180 kg`), qualificatifs (`≥ 75,0 %`),
  dimensions composées (`H x B x T 104,5 x 65 x 51,6 cm`), plages réglables
  (`163-436`) et les attributs `Atr*` de Jøtul.
- Deux pièges corrigés : `cm` collé au chiffre (`51,6cm`) n'a pas de frontière
  de mot ; un libellé large capturait `Höhe ext. Verbr.-luftzufuhr (mm)`
  (hauteur d'arrivée d'air, 95 mm) au lieu de `Höhe (cm)`.
- Règle maintenue : les colonnes d'émissions ne sont remplies que si la source
  indique une unité `mg` explicite. Un pourcentage reste dans
  `extra.technical_specs` pour revue plutôt que d'être converti.
- Gains : hauteur 270 → 395 produits, poids 187 → 320, puissance 438 → 460.
- La carte poêle affichait `Brennstoff` et `Farben`, renseignés pour ~131 et 28
  produits sur 527. Remplacés par `Höhe`, `Wirkungsgrad` et `Gewicht` :
  remplissage des cellules 48 % → 70 %.
- **Reste ouvert** : 33 poêles n'ont aucune des quatre valeurs (29 Camina,
  2 Austroflamm, 2 Wodtke). Camina ne publie ses spécifications que dans les
  Datenblätter PDF ; les extraire demande un parseur PDF (`pdfjs-dist`, non
  installé) et n'a pas été fait.

### Navigation

- Les dropdowns sont remplacés par un mégamenu (`src/components/layout/mega-menu.tsx`,
  primitive `src/components/ui/navigation-menu.tsx`) : colonnes de facettes avec
  compteurs réels, lien « Alle N ansehen » et 3 vignettes produit avec image
  Cloudinary et prix. Données via `src/lib/products/navigation.ts`, mises en
  cache 5 min (`unstable_cache`) car le layout s'exécute à chaque requête.
- Le panneau n'utilise pas le `Viewport` de Radix : le contenu est positionné
  contre le header. Radix insère un `div style="position:relative"` autour de
  la liste, neutralisé par `[&>div]:!static`, faute de quoi le panneau est
  limité à la largeur de la nav (472 px au lieu de 1 280 px).
- Le menu mobile réutilise exactement les mêmes données.
- Les vignettes ne sont pas triées par prix décroissant : la vitrine aurait
  affiché les trois produits les plus chers du catalogue.

### Filtres

- `CatalogFilters` n'était qu'un état local : cocher une case ne filtrait rien.
  Les filtres passent par l'URL (`?marke=`, `?holzart=`, `?laenge=`, …), sont
  appliqués côté serveur, partagés avec les liens du mégamenu et partageables.
  Vérifié : 527 → 40 (RIKA), 194 → 29 (Eiche), 194 → 22 (Holzhof24).
- La page Zubehör affichait des facettes inventées (Funkenschutz, Messing…) ;
  remplacées par le fournisseur réel.


## Import catalogue complet du 1er août 2026

Toutes les sources scrapées sont désormais importées en staging et lisibles sur
le storefront local. `scripts/db/import-source.mjs` (générique) et
`scripts/publish/source-media.mjs` (médias Cloudinary) remplacent les scripts
par source.

| Indicateur | Valeur |
| --- | --- |
| Produits en base | 739 (`is_published = false`, `review_status = pending`) |
| Poêles / Brennholz / Anzündholz / Briketts / Zubehör | 527 / 194 / 7 / 1 / 10 |
| Médias Cloudinary liés | 2 458 |
| Produits sans image | **0** |
| Sources | 17 (10 fabricants, 7 fournisseurs de bois) |

### Défauts de scraping corrigés le 1er août 2026

- `brennio` et `kaminholz-berlin` ajoutaient au fichier du jour sans le vider :
  une seconde exécution dupliquait tout le catalogue (178 lignes pour 116
  produits). Le fichier est désormais tronqué avant écriture.
- Extraction d'images : le motif `src="…jpg"` ignorait les query strings
  (`?ts=`, `?v=`), les attributs en apostrophes simples, `data-src` et `srcset`.
  Conséquence : 0 image sur `holzfront`, `holzhof24`, `holzmueller` et des trous
  sur `brennio`/`kaminholz-berlin`. `_lib/shopware.mjs` couvre maintenant
  JSON-LD, `og:image`, PhotoSwipe, lazy-loading et `srcset`, avec déduplication
  des variantes de taille et filtrage des icônes de paiement.
- `camina` : 33 des 49 « produits » pointaient vers un PDF au lieu d'une fiche,
  sans image ni dimension. Les cartes catalogue sont maintenant parsées
  correctement (image, titre, H×L×P), le PDF devient un document et
  `source_url` pointe la page catalogue. 49/49 avec image.
- `maxblank` : la catégorie `Designkamine/Systemkamine` n'était pas reconnue et
  écartait Nimes Crystal. 75/86 produits (10 accessoires outdoor exclus
  volontairement, 1 page en HTTP 500 côté fabricant).
- Détection bois : essence, longueur, humidité et unité étaient lues dans la
  description, d'où des valeurs fausses (« Räucherpellets Apfel » → Erle,
  « Wärme schenken » → Esche, longueur « 00 cm »). La détection porte
  désormais sur le titre seul.
- Classification : services de livraison/empilage et bons cadeaux étaient
  importés comme produits. `detectProductKind` sépare
  wood/kindling/briquette/pellet/accessory et marque `skip_import` pour les
  services et bons cadeaux (3 exclusions chez `holzfront`).
- Slugs : 3 collisions (titres `h1` identiques sur des URL distinctes) écrasaient
  silencieusement des produits à l'upsert. `dedupeSlugs` les désambiguïse via
  l'URL.
- `jotul` : 9 URL de catégorie étaient comptées comme échecs produit ; le filtre
  du sitemap ne retient plus que `/de/produkte/<cat>/<modele>` → 137/137.
- Lecture catalogue : PostgREST plafonne à 1 000 lignes et un filtre
  `product_id=in.(…)` sur plusieurs centaines d'UUID dépasse la taille d'URI.
  `src/lib/products/catalog.ts` pagine et découpe par lots, avec reprise sur
  erreur réseau.
- `vitest.config.ts` collectait les tests du dossier de sauvegarde
  `node_modules.corrupt-20260730/` (18 échecs parasites).

### Affichage

- `/brennholz`, `/anzuendholz`, `/holzbriketts`, `/holzpellets` partagent
  `FuelCatalog`; les trois dernières routes n'existaient pas et renvoyaient 404
  depuis l'accueil.
- Fiche produit combustible `/brennholz/[slug]` créée : la carte bois pointait
  vers `/produkt/[slug]`, route inexistante.
- La carte bois affiche l'image Cloudinary réelle, sans bouton panier ni stock
  simulé (les produits sont en revue).
- Les facettes de filtre des catalogues poêles et bois sont calculées sur les
  produits réellement affichés ; les compteurs étaient codés en dur.
- Accueil : la section bois n'affirme plus « meistbestellten » (aucune commande
  n'existe) et n'est plus vide ; les compteurs de catégories sont réels.

### Reste ouvert

- `maxblank` `produkt/frankfurt-2` : HTTP 500 permanent côté fabricant.
- HARK : 2 images sources > 10 MiB refusées par Cloudinary ; les produits
  conservent leurs autres images.
- Vague 3 (agrégateurs Ofen.de, Kaminofen-Shop, Feuerdepot, Feuer-Fuchs,
  Kaminofen-Shop24h) non implémentée : son objet documenté est la structure de
  catalogue et les fourchettes de prix, pas l'alimentation produit.
- Aucun produit n'est publié : la revue humaine et les documents de conformité
  restent la condition de publication.


## Phase

`Sprint 2 — Catalogue` en cours. Supabase hébergé contient les catalogues
Spartherm et HARK en revue réglementaire, et le storefront public lit
exclusivement les données autorisées par RLS. En développement uniquement, les
produits non encore publiés sont visibles avec le badge factuel
`Herstellerdaten` afin de poursuivre la revue catalogue.

## Terminé

- PRD produit, technique et juridique.
- Brief UI/UX détaillé.
- Liste de sources produits et conformité.
- Instructions persistantes `AGENTS.md`.
- Architecture cible et spécification backend.
- Design language verrouillé et handoff storefront.
- Configuration Codex autonome limitée au workspace.
- MCP documentation et navigateur.
- Skills projet frontend et backend.
- `S1.1` — Scaffold Next.js App Router, TypeScript strict, Tailwind v4, ESLint, Vitest, Playwright, scripts `lint`/`typecheck`/`test`/`test:e2e`/`build`, `.env.example` sans secret, page de démarrage allemande, smoke test unitaire (`src/lib/utils.test.ts`) et Playwright (`tests/e2e/smoke.spec.ts`). Build valide.
- `S1.2` — Radix primitives et shadcn/ui installés ; tokens `.ulpi/design/DESIGN.md` encodés dans `src/app/globals.css` via `@theme inline`. Composants UI initialisés (`button`, `badge`, `checkbox`, `input`, `label`).
- `S1.4` — Layouts publics (existant), compte (route group `konto/(authenticated)/`) avec barre latérale, légal (`src/app/(legal)/`) avec Impressum, AGB, Datenschutz, Widerruf, Versand, Zahlung en placeholder, admin (`src/app/admin/`) avec navigation dédiée et bandeau d'alerte sécurité.
- `S1.5` — CI GitHub Actions (`.github/workflows/ci.yml`) : jobs `static` (lint + typecheck + unit + build) et `e2e` (Playwright avec artefact rapport). Concurrency par ref et cache pnpm activés.
- `S1.3` — migrations Supabase initiales, RLS explicites, buckets, clients
  serveur/navigateur/public typés et validation des variables d'environnement.
- `S2.1` — modèle catégories, marques, opérateurs économiques, produits,
  variantes, médias, documents et contrôles de conformité. Repository public
  `src/lib/products/catalog.ts` branché sur l'accueil, les catalogues et la
  fiche poêle, sans fallback JSONL/fixtures.
- Import staging Spartherm : 28 produits `pending` non publiés, 130 variantes,
  165 médias Cloudinary, 159 PDF stockés dans le bucket privé Supabase
  `documents` et 56 contrôles de conformité `pending`. Les anciens produits
  sont conservés et affichés `Auf Anfrage` dans l'aperçu local.
- Import HARK : 59 produits `pending` non publiés avec prix fabricant TTC,
  caractéristiques et variations. Le scraper a collecté 2 132 spécifications,
  853 métadonnées de documents et 186 URL d'images, en excluant les contacts
  fabricant. L'entreprise a confirmé les droits de réutilisation des textes et
  images : 184 images sont hébergées dans Cloudinary et référencées dans
  Supabase ; 2 sources de plus de 10 MiB ont été omises sans laisser de produit
  sans image. Les documents PDF ne sont pas inclus dans cette autorisation.
- Aperçu catalogue local : les 87 poêles en revue sont lisibles côté serveur
  uniquement sous `next dev`, marqués `Herstellerdaten`. HARK affiche ses prix
  fabricant et ses images autorisées ; Spartherm reste sur demande de devis.
  Les actions commerciales et la comparaison restent désactivées. La
  production reste soumise à la RLS publique.
- Accueil poêles : 9 cartes visibles, soit 3 rangées à partir du breakpoint
  desktop, médias sur surface opaque, badge `Herstellerdaten` opaque et bouton
  `Mehr anzeigen` vers le catalogue complet.
- Scraper HKI CERT : 77 fabricants et 1 360 entrées Spartherm indexés ; rapport
  de rapprochement produit généré sans validation automatique.
- Rapprochement HKI Spartherm : 22/28 produits résolus automatiquement, 40
  références persistées dans `hki_devices` ; les 6 restants (Largo L/L steel/S/S
  steel, Lungo 2L/2R) sont documentés dans
  `data/scraped/hki-cert/unmatched-products.json` pour revue manuelle. Les
  22 produits résolus sont marqués `ecodesign_2022=true` et
  `bimschv_stufe=Stufe 2` avec `compliance_verified_at` renseigné.
- Autorisation utilisateur du 31/07/2026 : `data/licenses.json` couvre toutes
  les sources produit (10 fabricants, 5 agrégateurs Vague 3, 7 fournisseurs de
  bois Vague 4) avec scope `specs`/`images`/`videos`/`pdf` ; évidence =
  déclaration utilisateur en session, contrat écrit à référencer
  ultérieurement. Les 8 scrapers fabricants lisent désormais leur licence via
  `getLicense` (plus de valeurs en dur) et `pnpm run scrape:<source>` existe
  pour chacune.
- Scrapes complets du 31/07/2026 (tous `review_status: pending`, non publiés,
  `data/scraped/` gitignoré) : RIKA 40, Austroflamm 72, Jøtul 137/146 (9
  catégories sans fiche), Wodtke 37, Max Blank 74/86 (1 erreur HTTP 500
  consignée `_errors.jsonl`), Ofen Koppe 10, Skantherm 20, Camina & Schmid 49.
- Contrôles de conformité : `product_compliance_checks` alimentés depuis les
  références HKI (Ecodesign 2022 et 1. BImSchV Stufe 2 `verified` pour les
  22 produits, `pending` pour les 6 manquants) et reliés aux certificats
  Spartherm stockés (Ökodesign / Leistungserklärung / Konformitätserklärung).
  Seule la marque est affichée ; opérateurs économiques et contacts fabricant
  exclus (ADR-012).

## Tranche en cours

`S2.2` — conformité, opérateurs économiques et documents.

État du rapprochement HKI des 28 produits Spartherm :

- 22 produits résolus et contrôles `verified` avec référence HKI et certificat
  lié ;
- 6 produits sans rapprochement simple (Largo ×4, Lungo 2L/2R) — `pending` en
  attente de confirmation fabricant, consignés dans
  `data/scraped/hki-cert/unmatched-products.json` ;
- les opérateurs économiques et les contacts fabricant ne sont pas renseignés
  par décision (hors périmètre autorisé, ADR-012) ; seuls les noms de marque
  sont affichés ;
- chaque produit reste non publié jusqu'à revue humaine des exigences
  obligatoires restantes (documents HARK, textes juridiques, données
  entreprise).

Prochaine action sûre : finaliser la revue des 6 produits manquants avec
documents fabricant, puis avancer sur `S2.3` (accueil et navigation globale).

## Vérifications du 2 août 2026

- Tous les médias produit visibles utilisent désormais un cadre carré et
  `object-fit: cover` : accueil, catalogues bois/poêles, mega-menu, fiches
  produit, miniatures, Merkliste, comparateur, mini-panier et panier.
- Les références image sont persistées avec les lignes panier afin d'afficher
  le vrai produit ; les anciens paniers sans image conservent leur pictogramme
  de repli.
- Le loader Cloudinary conserve les transformations carrées `c_fill` et livre
  une ressource carrée à la largeur responsive demandée ; 2 tests unitaires
  couvrent le recadrage carré et la conservation du ratio éditorial.
- Playwright CLI : accueil (cartes 252 × 252), catalogue poêles (289 × 289),
  fiche Rönky (605 × 605), Merkliste (266 × 266), mini-panier (64 × 64),
  panier (80 × 80) et comparateur validés avec `object-fit: cover`, sans erreur
  console. Ajout panier, Merkliste et comparaison validés sur le produit Rönky.
- Le checkout `/kasse` n'est pas encore implémenté (`S4.5`) : aucun écran
  produit checkout n'existe à uniformiser dans cette tranche.
- `pnpm typecheck` et `pnpm lint` valides ; `pnpm test` : 88/88, dont les 2
  nouveaux tests du loader Cloudinary.
- `pnpm build` compile le code et valide les types, mais échoue ensuite pendant
  la collecte App Router sur des modules framework existants (`/agb`, puis
  `/_document`). Le cache `.next` corrompu a été déplacé vers
  `.next-stale-20260802-square-images` ; l'échec de manifest persiste après une
  reconstruction propre et n'est pas lié aux composants média modifiés.

## Vérifications du 31 juillet 2026

- `scripts/db/verify-compliance.mjs` : 44 contrôles `verified` (22 produits ×
  2 standards) avec certificat lié, 12 contrôles `pending` (6 produits × 2),
  40 références `hki_devices`, 22 produits `ecodesign_2022=true` +
  `bimschv_stufe=Stufe 2`.

## Vérifications du 29 juillet 2026

- `pnpm db:check` : vue publique = 6 catégories, 0 produit ; revue = 87
  produits, 130 variantes, 349 médias, 159 documents et 56 contrôles.
- `pnpm typecheck` : valide.
- `pnpm lint` : valide, avec avertissement de dépréciation `next lint`.
- `pnpm test` : 7/7 tests valides.
- `pnpm build` : valide (Next.js 15.5.22, 15 pages statiques et routes catalogue
  dynamiques compilées).
- `pnpm build` après enrichissement HARK : compilation, manifest App Router
  complet et `BUILD_ID` générés. Le wrapper RTK a expiré après 10 minutes avant
  de restituer la sortie finale ; le build Next.js s'est finalisé côté processus
  enfant.
- Playwright MCP : accueil et `/kaminoefen` répondent en 200 depuis Supabase,
  états vides présents, calculateur sans donnée simulée, identifiants de champs
  uniques, aucun overflow horizontal et aucune erreur de page.
- Playwright MCP : `/kaminoefen` affiche 87 produits staging ; Hark 57 affiche
  `ab 2.779,00 €`, les poêles Spartherm affichent `Auf Anfrage`, les PDF
  Spartherm utilisent des URL Supabase signées et la section `Dateien` est
  absente des fiches HARK sans fichier stocké.
- Playwright MCP : accueil validé à 1280 × 720 et 390 × 844 ; 9 cartes poêles,
  badge opaque, images Spartherm/HARK, 3 rangées desktop, bouton
  `Mehr anzeigen`, aucun débordement horizontal observé.

## Bloqueurs métier avant données réelles

- raison sociale, forme juridique, adresse, représentants et contacts ;
- domaine définitif ;
- régime TVA et validation du conseiller fiscal ;
- fournisseurs et catalogues autorisés hors périmètre HARK confirmé ;
- zones, tarifs et modalités réels de livraison ;
- transporteur et processus de déchargement ;
- configuration Supabase, Stripe/PayPal, Resend et Telegram ;
- textes juridiques validés par un avocat allemand ;
- processus d'installation et partenaires qualifiés ;
- décision d'hébergement commercial avant ouverture des ventes.

Ces bloqueurs n'empêchent pas le développement avec fixtures clairement fictives.

## Bloqueurs techniques précis

- La génération des types du projet Supabase hébergé est refusée au compte
  courant (`necessary privileges`). Un sous-ensemble catalog typé, aligné sur
  les migrations, est maintenu dans `src/lib/db/types.ts` en attendant le droit.
- 6 correspondances HKI manquantes (Largo L/L steel/S/S steel, Lungo 2L/2R) ;
  propriétaire attendu : revue catalogue/conformité avec documents fabricant.
  Opérateurs économiques et contacts fabricant exclus par décision (ADR-012) ;
  l'obligation GPSR devra être revalidée avant ouverture des ventes.
- Les documents PDF HARK sont désormais couverts par l'autorisation du
  31/07/2026 (scope `pdf`) ; le scraper hark.mjs suit la licence via
  `getLicense`. Le contrat écrit reste à référencer dans `data/licenses.json`
  (évidence provisoire : déclaration utilisateur en session).
- Des préchargements de liens relèvent encore des 404 sur des routes non
  implémentées (`/holz-ratgeber`, `/ueber-uns`, favicon).

## Décisions techniques ajoutées

- Les formulaires interactifs sont extraits dans des composants clients séparés (ex : `LoginForm`, `FooterNewsletter`) pour permettre la génération statique des pages parents Server Components. Voir ADR-007 à ajouter.

## Convention de suivi

Pour chaque tranche, enregistrer :

- statut : `todo`, `in_progress`, `blocked`, `done` ;
- tests exécutés ;
- décision ou hypothèse ajoutée ;
- blocage exact et propriétaire attendu.
# Mise à jour 2026-08-02 — Promotions, factures, FAQ/chat et relance panier

Implémenté :

- migration `20260802000011_promotions_invoices_ai_recovery.sql` : promotions multi-produit/catégorie, redemptions atomiques, FAQ, conversations, paniers consentis, jobs idempotents, séquences facture, bucket privé et RLS ;
- backoffice `/admin/rabatte`, `/admin/faq`, paramètres facture/chat/relance ;
- code promo dans `/kasse`, validation et recalcul serveur, snapshot commande et ventilation par ligne ;
- FAQ publique `/faq` et widget contextuel Mistral/RAG, désactivé par défaut ;
- relance panier Resend avec consentement, restauration, désinscription, signature et route cron protégée ;
- factures A4 dynamiques avec logo/données entreprise, numérotation atomique, SHA-256, stockage privé et téléchargement admin.

Validation : TypeScript, lint, build production et 106 tests applicatifs passent ; le test PDF dédié passe et son rendu A4 a été inspecté visuellement. La configuration Supabase a été actualisée pour le CLI 2.110.0.

Blocage environnement : Docker Desktop n'est pas démarré, donc la nouvelle migration n'a pas pu être appliquée à la base locale. Aucun envoi Resend, appel Mistral ou déploiement n'a été activé.
