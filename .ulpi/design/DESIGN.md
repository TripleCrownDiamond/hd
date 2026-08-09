---
project: HOLZKRAFT
register: product
aesthetic_direction: organic / natural
color_strategy: restrained
design_system: Radix primitives + shadcn/ui
design_variance: 6
motion_intensity: 3
visual_density: 6
---

# Design language verrouillé

## Design Read

Une maison de bois allemande précise et contemporaine : la chaleur vient de la matière, la confiance vient de la donnée.

## Signature

La signature est la `Holzschnitt-Leiste`, une règle asymétrique inspirée de chants de bûches empilées. Elle alterne segments vert sombre, bois et vide, toujours sur une seule ligne. Elle sépare les grands changements de contexte, souligne le calculateur de livraison et peut devenir un indicateur de progression. Elle ne doit jamais devenir un motif de fond.

Tout le reste demeure calme : grilles nettes, photographies réelles, tableaux lisibles et densité maîtrisée.

## Inspiration

- Brief HOLZKRAFT : took: chaleur domestique, vert forêt, bois réel, données techniques et livraison locale. rejected: palette beige générique, grandes cartes identiques et promesses écologiques vagues.
- Références fournisseurs du document source : took: précision des fiches techniques, photographie produit et documents téléchargeables. rejected: reproduction de marque, texte ou média sans autorisation.
- Références marchandes du document source : took: profondeur de filtre et hiérarchie des attributs. rejected: densité non hiérarchisée, faux sentiment d’urgence et badges non vérifiés.

Synthèse : une boutique éditoriale par la matière, mais utilitaire dès qu’un choix technique, un prix ou une obligation intervient.

## Identité verrouillée

Every screen must read as the same product if placed side by side.

### Couleur

Les valeurs OKLCH sont la source CSS moderne ; les hex sont les fallbacks et références de revue.

| Rôle | OKLCH | Hex | Usage |
| --- | --- | --- | --- |
| `background` | `oklch(0.975 0.008 135)` | `#F7F8F3` | fond global cendré, pas crème |
| `surface` | `oklch(1 0 0)` | `#FFFFFF` | fiches, formulaires, tableaux |
| `elevated` | `oklch(0.945 0.012 145)` | `#EEF2EC` | panneaux secondaires |
| `text` | `oklch(0.285 0.047 165)` | `#102E27` | texte principal |
| `muted` | `oklch(0.46 0.027 165)` | `#4B5D56` | texte secondaire |
| `subtle` | `oklch(0.82 0.018 145)` | `#CBD5CD` | séparateurs non textuels |
| `border` | `oklch(0.875 0.015 145)` | `#D9E1DA` | bordures |
| `brand` | `oklch(0.40 0.115 148)` | `#186A2E` | vert KRAFT du wordmark ; surfaces de marque et CTA sombre |
| `accent` | `oklch(0.50 0.145 42)` | `#A43F1D` | action primaire, feu maîtrisé |
| `wood` | `oklch(0.32 0.09 42)` | `#4A2214` | brun HOLZ du wordmark ; signature et détails matériels |
| `success` | `oklch(0.46 0.095 150)` | `#26734D` | livrable, disponible, confirmé |
| `warning` | `oklch(0.70 0.14 80)` | `#B87912` | stock faible, vérification |
| `danger` | `oklch(0.46 0.14 30)` | `#9C352A` | erreurs et actions destructives |
| `info` | `oklch(0.48 0.08 235)` | `#356A82` | information neutre |

Répartition : 60 % `background/surface`, 30 % verts et photographie, 10 % maximum `accent/wood`.

Contrastes de référence (palette recalée sur le logo HOLZKRAFT, à revérifier avec un outil de contraste) :

- `text` sur `background` : `≥ 13:1`.
- `text` sur `surface` : `≥ 14:1`.
- `muted` sur `background` : `≥ 6.5:1`.
- blanc sur `accent` : `≥ 6.3:1`.
- blanc sur `brand` (KRAFT green) : `≥ 6.2:1` — vérifier pour texte < 18 px.
- blanc sur `wood` (HOLZ brown) : `≥ 9:1`.
- `text` sur `border` clair : `≥ 10:1`.

Ne pas utiliser `warning` seul comme texte sur blanc sans vérifier le contraste. L’accompagner d’une icône et utiliser `text` pour le libellé.

### Typographie

| Rôle | Famille | Usage | Notes |
| --- | --- | --- | --- |
| display | `Newsreader` | titres marketing et éditoriaux | 500/600, tracking `-0.018em`, jamais sous 28 px |
| body | `Manrope` | navigation, formulaires, lecture | 400/500/600/700, mesure 68 ch |
| utility | `IBM Plex Mono` | SKU, dimensions, prix de base, données | 400/500, chiffres tabulaires |

Contraste d’axe : serif humaniste pour la chaleur, sans géométrique lisible pour les tâches, mono uniquement pour la précision. Héberger les fontes localement et utiliser des fallbacks métriquement compatibles.

Échelle :

```text
12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 / 64 px
```

Le corps principal ne descend jamais sous 16 px. Les titres utilisent `text-wrap: balance`, les paragraphes `text-wrap: pretty`.

### Espacement

Base 4 px :

```text
0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
```

Les sections publiques utilisent 64 à 96 px verticalement sur desktop, 40 à 64 px sur mobile. Les surfaces transactionnelles privilégient 24 à 40 px.

### Rayons

```text
sm 4, md 8, lg 12, xl 16, full 9999
```

- contrôles : `md` ;
- cartes : `lg` ;
- grands médias : `xl` ;
- badges : `full`.

Pas de carte avec un rayon supérieur à 16 px. Pas de carte imbriquée.

### Ombres

```text
sm: 0 1px 2px rgb(16 46 39 / 0.06)
md: 0 8px 24px rgb(16 46 39 / 0.10)
lg: 0 20px 50px rgb(16 46 39 / 0.14)
```

Les bordures établissent la structure. L’ombre est réservée aux éléments superposés.

### Z-index

```text
base 0
dropdown 20
sticky 30
fixed 40
modalBackdrop 45
modal 50
popover 60
toast 70
skipLink 80
```

### Breakpoints

```text
sm 640
md 768
lg 1024
xl 1280
2xl 1536
```

Conteneur de lecture : 72 rem maximum. Contenu légal : 46 rem maximum. Catalogue : 90 rem maximum.

### Mouvement

```text
fast 120ms
base 300ms
emphasis 500ms
easing cubic-bezier(0.16, 1, 0.3, 1)
```

Une animation doit expliquer un changement : ouverture, réorganisation, confirmation ou progression. Aucun bounce, aucune animation infinie décorative. En `prefers-reduced-motion`, supprimer déplacements et parallaxe, garder seulement les changements d’opacité immédiats.

## Iconographie et photographie

- Icônes : Lucide uniquement, trait 1.75 px, tailles 16/20/24.
- Ne jamais utiliser une icône seule si son sens n’est pas évident.
- Photos : lumière naturelle, conditionnement réel, échelle lisible, aucune teinte orange artificielle.
- Images fournisseur : uniquement après autorisation.
- Fiches fictives : placeholders explicitement fictifs, aucune marque réelle.
- Documents de conformité : aperçu sobre, état de vérification textuel et daté.

## Composition

- Hero `product-in-context` avec grille asymétrique 7/5, non centré sur un fond sombre.
- Avantages sous forme de bande de preuves avec séparateurs, pas trois cartes égales.
- Catégories en grille asymétrique 2+3.
- Catalogue : filtres latéraux, liste/grille dense et comparaison persistante.
- Fiche technique : galerie + achat, puis table, documents et explications.
- Checkout : une action primaire par étape et résumé collant.
- Admin : densité supérieure, tables et panneaux latéraux, même palette et mêmes contrôles.

Au moins trois familles de mise en page par page longue : média asymétrique, bande horizontale, grille éditoriale, table ou liste divisée.

## Voix

- Registre : allemand clair, factuel, rassurant, sans emphase commerciale.
- Verbes d’action : `Prüfen`, `Auswählen`, `In den Warenkorb`, `Weiter`, `Zahlungspflichtig bestellen`.
- Résultats : `Geprüft`, `Ausgewählt`, `Hinzugefügt`, `Bestellung eingegangen`.
- Ne pas écrire : `nachhaltig`, `klimaneutral`, `zertifiziert`, `für jeden Ofen geeignet` sans preuve précise.
- Distinguer fait, estimation et action professionnelle requise.
- Une erreur explique ce qui s’est passé et comment continuer.

## Système de composants

Utiliser Radix primitives et shadcn/ui comme base comportementale. Les composants sont thémés avec ces tokens. Ne pas recréer Dialog, Select, Checkbox, Tabs, Toast ou Drawer à la main.

Les composants métier restent propres au projet : `DeliveryChecker`, `WoodProductCard`, `StoveProductCard`, `EnergyLabel`, `PriceDisplay`, `TechnicalSpecs`, `ComparisonBar`, `OrderTimeline`.

## Interdictions

- pas de gradient multicolore ou texte en gradient ;
- pas de glassmorphism générique ;
- pas de mesh sombre derrière un hero centré ;
- pas de rangée répétitive de trois cartes égales ;
- pas de cartes imbriquées ;
- pas de faux logo d’avis, badge ou certification ;
- pas de motif bûche partout ;
- pas d’énormes titres qui repoussent l’action sous la ligne de flottaison ;
- pas de couleur seule pour transmettre un statut.

## Verrou intersession

Relire ce fichier avant toute nouvelle page. Toute valeur absente doit être signalée puis ajoutée ici par une décision délibérée. Ne jamais introduire silencieusement une nouvelle couleur, fonte, échelle, famille d’icônes ou style de rayon.
