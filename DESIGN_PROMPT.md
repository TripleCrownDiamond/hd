# HOLZKRAFT — Prompt de génération de design

Tu es un designer produit senior spécialisé e-commerce. Génère un design complet, cohérent
et production-ready pour **HOLZKRAFT**, une boutique en ligne allemande de bois de chauffage,
granulés, briquettes, poêles à bois et accessoires.

Livre chaque écran comme s'il faisait partie d'un même produit : identité visuelle strictement
verrouillée, hiérarchie constante, aucune variation gratuite.

---

## 1. Contexte marque

- **Marché** : Allemagne, langue UI 100 % `de-DE`.
- **Positionnement** : maison de bois précise et contemporaine ; la chaleur vient de la matière,
  la confiance vient de la donnée. Pas de beige générique, pas de promesses écologiques vagues,
  pas de faux badges.
- **Ton** : sobre, factuel, chaleureux mais utilitaire dès qu'un choix technique, un prix ou
  une obligation intervient.
- **Registre** : `product` (pas éditorial pur, pas dashboard sec).

## 2. Design language verrouillé

### Palette (OKLCH ; hex de référence)

| Rôle | Hex | Usage |
| --- | --- | --- |
| `background` | `#F7F8F3` | fond global cendré |
| `surface` | `#FFFFFF` | fiches, formulaires |
| `elevated` | `#EEF2EC` | panneaux secondaires |
| `text` | `#102E27` | texte principal |
| `muted` | `#4B5D56` | texte secondaire |
| `border` | `#D9E1DA` | bordures |
| `brand` | `#173F35` | vert forêt, CTA sombre, admin |
| `accent` | `#A43F1D` | feu maîtrisé, action primaire |
| `wood` | `#76523D` | signature et matière |
| `success` | `#26734D` |
| `warning` | `#B87912` |
| `danger` | `#9C352A` |
| `info` | `#356A82` |

Répartition : 60 % `background`/`surface`, 30 % verts + photo bois réelle, 10 % max `accent`/`wood`.

### Typographie

- Display : **Newsreader** (serif humaniste, 500/600, tracking `-0.018em`, jamais < 28 px).
- Body : **Manrope** (400/500/600/700, mesure ≤ 68 ch).
- Utility : **IBM Plex Mono** (chiffres tabulaires : SKU, prix, dimensions).
- Échelle : 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 px. Corps ≥ 16 px.
- `text-wrap: balance` pour titres, `pretty` pour paragraphes.

### Espacement et rayons

- Base 4 px : 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.
- Sections publiques : 64–96 px vertical desktop, 40–64 px mobile.
- Rayons : sm 4, md 8, lg 12, xl 16, full 9999.

### Signature visuelle : `Holzschnitt-Leiste`

Barre de 6 px de haut, segments asymétriques alternant `brand`, `wood` et vide, jamais motif de
fond. Sépare les grandes bascules de contexte. Sert aussi de repère pour la section livraison.

### Accessibilité (non négociable)

- WCAG 2.2 AA, focus visible (anneau 3 px `accent`, offset 2 px).
- Cibles tactiles ≥ 48 px.
- `prefers-reduced-motion` respecté.
- Skip link, un seul `h1` par page, landmarks explicites.
- Zoom 200 % sans scroll horizontal global.

---

## 3. Home page (`/`)

Sections dans cet ordre exact :

1. **Announcement bar** — bandeau très fin `brand/5`, message livraison, dismissible ?
2. **Header** — sticky, blur, hauteur 64 (mobile) / 72 (desktop). Logo wordmark `HOLZKRAFT` en
   `Newsreader` + navigation `Sortiment` (mégamenu), `Kaminöfen`, `Liefergebiet`, `Ratgeber`,
   `Über uns`. Actions : recherche (overlay), compte, favoris, panier avec badge count.
3. **Hero** — grille 7/5 desktop. Titre `Wärme, die bei Ihnen ankommt.`, sous-titre court, CTA
   primaire `Brennholz bestellen` (accent), CTA secondaire `Kaminöfen entdecken` (outline
   accent). Media = photo bois réelle (buche fendue ou pile). Sur mobile : texte puis
   `DeliveryChecker` avant le média.
4. **`DeliveryChecker`** — input PLZ 5 chiffres (`inputmode="numeric"`, `autocomplete="postal-code"`),
   bouton `Prüfen`, résultat en `aria-live="polite"`. Sous-tendu par la `Holzschnitt-Leiste`.
5. **BenefitsStrip** — bande divisée 4 preuves : `Geprüfte Qualität`, `Transparente Mengen`,
   `Sichere Zahlung`, `Zuverlässige Lieferung`. Icônes Lucide, pas d'emoji.
6. **CategoryGrid** — mosaïque asymétrique 5 catégories : Brennholz (colonne large), Kaminöfen,
   Pellets, Briketts, Zubehör. Chaque tuile : photo produit, nom, compteur `x Produkte`.
7. **FeaturedProducts** — grille bois 4/2/1 ; 4 cartes bois avec l'ordre suivant :
   image + favori, badge factuel, nom, essence/longueur/humidité, quantité + unité explicitée,
   prix TTC + prix de base, stock + délai, action.
8. **StoveSection** — composition éditoriale gauche/droite. Trois cartes poêles :
   image studio, marque + modèle, classe énergétique, puissance/rendement/raccord, prix + délai,
   `Details ansehen`.
9. **HowItWorks** — 4 étapes en ligne progressive : `Produkt auswählen`, `Liefergebiet prüfen`,
   `Sicher bestellen`, `Lieferung erhalten`. Flèches connectrices sur desktop.
10. **QualitySection** — image/texte 50/50 : `Sie wissen genau, was Sie bekommen.` + liste
    `Holzart & Herkunft`, `Restfeuchte`, `Länge & Maße`, `Mengeneinheiten`.
11. **DeliverySection** — carte schématique des zones + `DeliveryChecker` répété. **Ne jamais
    prétendre couvrir toute l'Allemagne.**
12. **ReviewsSection** — 3 avis avec mention explicite `* Diese Bewertungen sind fiktive
    Beispiele für die Darstellung.` tant que les avis ne sont pas réels.
13. **GuidesSection** — 3 cartes articles avec catégorie, titre, extrait, auteur, date.
14. **NewsletterSection** — pleine largeur fond `brand`, texte blanc, formulaire e-mail +
    checkbox consentement explicite lié à la `/datenschutz`.
15. **Footer** — 4 colonnes : Sortiment, Service, Rechtliches, Kontakt. Newsletter compacte.
    Bandeau bas : mentions, moyens de paiement, année.

---

## 4. Boutique — Catalogue

### `/brennholz`, `/kaminoefen`, `/holzpellets`, `/holzbriketts`, `/zubehoer`

- Fil d'Ariane + `h1` + intro courte + compteur `x Produkte`.
- **Desktop** : colonne filtres sticky 280 px à gauche + grille 3 col (4 dès 1440 px si lisible).
  Barre tri + filtres actifs (chips supprimables) au-dessus.
- **Mobile** : compteur + boutons `Filtern`/`Sortieren` déclenchant un drawer plein écran ;
  grille 1 col ; barre de comparaison au-dessus de la safe area.
- **Filtres bois** : essence, longueur (25/33 cm), humidité, unité, prix, stock, délai.
- **Filtres poêles** : puissance kW, rendement %, classe énergétique, combustible, raccord Ø,
  marque, prix.
- `Mehr anzeigen` plutôt que pagination opaque.

### Cartes produit (variants)

- **Wood** : image + favori, badge factuel, nom, essence+longueur+humidité, quantité+unité,
  prix TTC + prix de base, stock + délai, CTA `In den Warenkorb`.
- **Stove** : image studio, marque + modèle, classe énergétique, puissance/rendement/raccord,
  prix + délai, `Details ansehen` + actions secondaires comparer/favori.
- Stock jamais transmis par couleur seule (icône + libellé).

### Comparateur `/kaminoefen/vergleich`

- Maximum 4 colonnes ; première colonne d'attributs collante sur desktop.
- Cartes synthétiques puis matrice attribut/produit.
- Sur mobile : chaque attribut affiche les produits côte à côte en scroll horizontal avec
  en-têtes collants.
- Différences mises en avant par graisse + fond `elevated`, **jamais** par un verdict
  « meilleur ».

## 5. Fiche produit

### `/kaminofen/[slug]`, `/brennholz/[slug]`

Zone d'achat :

- Breadcrumbs.
- Galerie (thumbnails à gauche desktop, carrousel mobile).
- Titre + référence SKU (mono).
- Prix TTC + prix de base + mention TVA + lien livraison.
- Attributs essentiels en liste divisée.
- Sélecteur de variante (longueur / quantité / couleur).
- Quantité (spinner accessible).
- Stock + délai.
- Champ PLZ + devis livraison.
- CTA `In den Warenkorb`.
- Sur mobile : CTA collant en bas (nom court + prix + action).

Contenu complémentaire (accordéons Radix) :

- **Bois** : `Beschreibung`, `Technische Angaben`, `Mengeneinheiten` (schéma `Was bedeutet
  Schüttraummeter?`, aucune conversion universelle), `Lieferung`, `Lagerung`, `Häufige Fragen`.
- **Poêle** : puissance nominale, rendement, combustible autorisé, raccord, dimensions/poids,
  conformité documentée uniquement, **avertissement contrôle professionnel (Schornsteinfeger)**.
  Documents en liens secondaires nommés.

## 6. Panier `/warenkorb`

- Lignes divisées (pas de carte dans carte).
- Modification quantité avec état optimiste réconcilié.
- Suppression réversible (undo pendant ~5 s).
- Devis livraison + contraintes visibles.
- Résumé collant sur desktop : sous-total, TVA, livraison, total, tous distincts.
- Recommandations sous le résumé, **jamais précochées**.
- États : vide, invité, connecté, hors ligne (bandeau persistant), devis expiré.

## 7. Checkout `/kasse` (5 étapes)

`CheckoutStepper` avec `nav` + liste ordonnée + `aria-current="step"` :

1. `Kontaktdaten` — e-mail, téléphone, choix invité/compte.
2. `Lieferadresse` — pays verrouillé Deutschland, PLZ, ville, rue, complément.
3. `Lieferart` — options avec prix + délai + contraintes de déchargement.
4. `Zahlung` — Stripe (CB/wallets), PayPal, Vorkasse. Aucune donnée carte stockée.
5. `Prüfen und bestellen` — récap caractéristiques essentielles, adresse, service, moyen,
   total, TVA, AGB/Widerruf, consentements **non précochés**.

- Max 4 champs visibles par groupe.
- Erreurs sous le champ + résumé haut de formulaire avec liens de focus.
- CTA final exact : **`Zahlungspflichtig bestellen`**.

## 8. Post-commande

- `/bestellung/[id]` : confirmation, numéro de commande, résumé, prochaine étape.
- `/sendungsverfolgung` : champ numéro + donnée de vérification, timeline publique
  (`aria-live="polite"`) sans notes internes ni IDs prestataire, adresse masquée.
- `/rechnung/[id]` : accès protégé, URL signée courte.

---

## 9. Authentification

### `/konto/anmelden`

Layout centré 448 px max. Formulaire : e-mail, mot de passe, `Angemeldet bleiben`,
`Passwort vergessen?`, CTA `Anmelden` pleine largeur. Lien secondaire `Noch kein Konto? Registrieren`.

### `/konto/registrieren`

Champs : e-mail, mot de passe (indicateur de force accessible), confirmation, checkboxes
AGB + Datenschutz (**non précochées**), CTA `Konto erstellen`.

### `/konto/passwort-vergessen` et `/konto/passwort-zuruecksetzen`

Deux écrans : demande e-mail → confirmation neutre (pas d'énumération de comptes) → écran de
définition nouveau mot de passe via lien signé.

---

## 10. Compte client `/konto/*`

Layout avec sidebar 220 px (mobile : tabs scrollables horizontales).

Pages :

- **`/konto`** — dashboard : dernière commande, favoris récents, adresses par défaut, CTA.
- **`/konto/bestellungen`** — liste avec numéro, date, statut, total, action `Details`.
- **`/konto/bestellungen/[id]`** — timeline + lignes + facture téléchargeable si émise.
- **`/konto/favoriten`** — grille produits favoris ; état vide illustré.
- **`/konto/adressen`** — liste, adresse par défaut, ajouter/modifier/supprimer.
- **`/konto/einstellungen`** — nom, e-mail, mot de passe, préférences newsletter, RGPD (export
  et suppression).

---

## 11. Contenu et légal

- **`/holz-ratgeber`** — grille éditoriale + filtres catégorie.
- **`/holz-ratgeber/[slug]`** — mesure 68 ch, sommaire collant sur grand écran, mention
  auteur + date + temps de lecture.
- **`/ueber-uns`**, **`/kontakt`** — pages marketing.
- **`/impressum`, `/agb`, `/datenschutz`, `/widerruf`, `/versand`, `/zahlung`** — layout
  `container-legal` 46 rem, sidebar de navigation légale, bannière « à valider par juriste »
  tant que non validé, sommaire + `Zuletzt aktualisiert` + bouton imprimer.
- **Cookie banner** — dialogue non modal, 3 actions à poids visuel équivalent
  (`Alle akzeptieren`, `Alle ablehnen`, `Einstellungen`). Catégorie `Notwendig` verrouillée ;
  toutes les autres **off** par défaut.

---

## 12. Admin `/admin/*`

Layout : sidebar sombre `brand` 240 px avec logo + badge `Admin`, main clair.

Bandeau permanent en tête : « Zugriff geschützt, MFA erforderlich, alle Aktionen werden auditiert. »

Pages :

- **`/admin`** — overview : stat tiles (Bestellungen heute, Offene Zahlungen, Bestand niedrig,
  Support offen), courbe 30 jours, dernières commandes, alertes de conformité.
- **`/admin/bestellungen`** — table avec filtres (statut, paiement, livraison, période), détail
  latéral, transitions autorisées seulement.
- **`/admin/produkte`** — liste + éditeur multi-onglets (identité, attributs typés, prix,
  médias, documents, conformité, publication).
- **`/admin/bestand`** — mouvements par lot, réservations, alertes stock.
- **`/admin/kunden`** — recherche + dossier (données minimales par rôle).
- **`/admin/benachrichtigungen`** — file de jobs Resend/Telegram avec tentatives et rejeu.
- **`/admin/rechtstexte`** — versions des documents légaux, publication, comparaison entre
  versions, verrouillage des versions utilisées par une commande.

Composants dashboard : `DataTable` (tri, pagination, sélection, actions groupées),
`FilterBar`, `SidePeek`, `AuditLogEntry`, `StatusBadge`, `MoneyCell` (mono).

---

## 13. Composants transverses à styler

- `Button` — variants `primary` (accent), `secondary` (surface + border), `ghost`,
  `outline` (accent), `destructive`. Tailles 40/44/48. Loading conserve la largeur, expose
  `aria-busy`. Icônes Lucide.
- `Input`, `Textarea`, `Select` (Radix), `Checkbox`, `RadioGroup`, `Switch` — bordure 2 px,
  hauteur 48 px, focus `accent` 3 px offset 2.
- `Badge` — variants factuel (default), `brand`, `success`, `warning`, `danger`.
- `Toast` (Radix) — succès, info, erreur. Toujours accompagné d'un texte, pas seulement une
  couleur.
- `Dialog`, `Drawer`, `Popover` (Radix).
- `Accordion` (Radix).
- `Tabs` (Radix).
- `Tooltip` (Radix) — jamais essentiel à la compréhension.
- `Breadcrumbs`.
- `PriceDisplay` — TTC + devise + prix de base + lien livraison, chiffres tabulaires, centimes
  entiers.
- `DeliveryChecker`.
- `ProductCard` (variants wood/pellet/briquette/stove/accessory).
- `FilterDrawer`.
- `ComparisonBar`.
- `CheckoutStepper`.
- `OrderTimeline`.
- `CookieBanner`.

---

## 14. Interdits explicites

- Pas de faux badges, faux certificats, faux avis attribués à une plateforme.
- Pas d'affirmations environnementales non prouvées.
- Pas de compte à rebours artificiel, faux stock bas, faux « x personnes regardent ».
- Pas d'emoji dans l'UI de production (les emojis actuels sont des placeholders média).
- Pas de dégradés arc-en-ciel, pas de glassmorphism sans raison, pas de néons.
- Pas de photo générique de « bûches vernies » — favoriser bois brut, atelier, foyer réel.

---

## 15. Livrables attendus

Pour chaque écran, fournir :

1. Vue **desktop 1440 px**.
2. Vue **mobile 375 px**.
3. États : loading (skeleton conservant la géométrie), empty, error, unauthorized, success.
4. Focus rings visibles sur au moins un élément par écran.
5. Version dark **non requise** au MVP.

Format préféré : composants React + Tailwind CSS v4 (avec tokens CSS `oklch(...)` déjà nommés),
prêts à coller dans une structure Next.js App Router. Fournir un fichier `tokens.css` reprenant
les variables ci-dessus.
