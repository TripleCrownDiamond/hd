# Verkaufsmenge, Grundpreis und Preisplausibilität

État au 2026-08-09.

## 1. Pourquoi le prix à la tonne

Deux raisons, une légale et une opérationnelle.

**Légale.** Le § 4 PAngV impose un Grundpreis à côté du prix de vente pour toute
marchandise vendue au poids. L'unité de référence est en principe le kilogramme,
mais pour les marchandises livrées couramment par quantités de 50 kg et plus,
c'est l'unité usuelle du secteur qui s'applique — pour les combustibles solides,
la tonne. La boutique n'affichait aucun Grundpreis : `extra.base_price_cents`
était lu par le catalogue mais n'était écrit par aucun import ni par l'admin.

**Opérationnelle.** Sans dénominateur, un prix de palette collé sous une étiquette
« 15 kg » ne se distingue pas d'un prix de sac. C'est exactement l'erreur décrite
en § 3.

## 2. Comment configurer

Trois colonnes sur `products` (migration `20260809000012_product_sales_unit.sql`) :

| Colonne | Rôle | Valeurs |
| --- | --- | --- |
| `quantity_amount` | la quantité que le prix couvre | numérique > 0 |
| `quantity_unit` | l'unité de cette quantité | `kg` `t` `srm` `rm` `fm` `l` `stk` |
| `base_price_unit` | l'unité d'affichage du Grundpreis | `kg` `100kg` `t` `srm` `rm` `fm` `l` `stk` |

Le Grundpreis **n'est pas stocké**. Il est calculé à la lecture par
`computeBasePriceCents()` (`src/lib/utils.ts`), donc il ne peut jamais diverger du
prix qu'il décrit. Le formulaire admin (`/admin/produkte`) l'affiche en direct
pendant la saisie.

### Exemples

| Produit | `price_cents_public` | `quantity_amount` | `quantity_unit` | `base_price_unit` | Affiché |
| --- | --- | --- | --- | --- | --- |
| Palette 66 × 15 kg | `44900` | `990` | `kg` | `t` | 449,00 € · 453,54 € / t |
| Sac isolé 15 kg | `738` | `15` | `kg` | `kg` | 7,38 € · 0,49 € / kg |
| Vrac soufflé, 1 t | `41300` | `1` | `t` | `t` | 413,00 € · 413,00 € / t |
| Brennholz 3 SRM | `29900` | `3` | `srm` | `srm` | 299,00 € · 99,67 € / SRM |

### Règles de conversion

Les unités de masse (`kg`, `100kg`, `t`) se convertissent librement entre elles.
Les unités de volume ne se convertissent pas : passer du Schüttraummeter au
Festmeter demande un facteur qui dépend de l'essence et de la coupe, que le
catalogue ne détient pas. Une paire incompatible renvoie `null` — pas de
Grundpreis affiché — plutôt qu'un nombre faussement assuré.

### Vendre *à* la tonne

Le panier multiplie déjà `priceCents × quantity`. Pour une vente à la tonne, il
suffit donc de définir le produit comme « 1 tonne » (`quantity_amount = 1`,
`quantity_unit = 't'`) : la quantité du panier devient le nombre de tonnes. Aucun
palier dégressif n'existe encore ; ce serait à modéliser via `product_variants`.

### Base de données en retard sur la migration

`src/lib/products/catalog.ts` demande ces colonnes séparément et retombe sur
l'ancienne liste si PostgREST répond 42703. La boutique reste donc servie tant
que la migration n'est pas appliquée ; le Grundpreis apparaît après.

## 3. Audit de plausibilité des prix — pellets

Repères marché Allemagne, août 2026, TTC :

- sac isolé 15 kg : **≈ 7,38 €** (≈ 492 €/t)
- sackware sur palette : **371 – 492 €/t** selon la source
- vrac soufflé : **355 – 413 €/t**

Les 32 pellets du catalogue, ramenés au €/t :

| €/t | Prix affiché | « Menge » affichée | Verdict |
| --- | --- | --- | --- |
| 35 600 | 534,00 € | 15 kg | **prix de palette sous étiquette sac** (holzhof24, 5 produits) |
| 17 333 | 260,00 € | 15 KG | idem — le titre dit « PALETTE MIT 65 SÄCKEN » |
| 2 154 | 420,00 € | 13 × 15 kg | 195 kg réels ; pellets de fumoir, mais ~4× le marché |
| 514 | 509,00 € | 990 kg | haut de fourchette |
| 454 – 497 | 449 – 485 € | palette | **conforme au marché** |
| 192 – 410 | 190 – 400 € | palette | crédible à suspect selon le fournisseur |
| 5 – 10 | 5,09 – 9,89 € | 990 kg | **prix au carton sous étiquette palette** (frankenbrennstoffe) |

Deux défauts de données, symétriques :

1. **Prix de palette, étiquette de sac.** Le prix est juste, le dénominateur est
   faux. Cinq pellets holzhof24 et un ecoreichholz.
2. **Prix unitaire, étiquette de palette.** Trois pellets frankenbrennstoffe et
   au moins quatre briquettes de la même source.

Un troisième cas, plus discret : les briquettes en petits conditionnements
(6 – 30 kg) ressortent à 600 – 2 000 €/t. Ce n'est **pas** une erreur — le petit
volume coûte réellement plus cher au kilo —, mais un €/t affiché sans le
conditionnement induit en erreur. C'est pourquoi la carte produit montre le prix
de vente en grand et le Grundpreis en secondaire.

## 4. Reste à faire

- Appliquer les migrations `20260809000012` à `20260809000014` (non appliquées :
  la base est hébergée, aucune migration n'a été poussée depuis cette session).
- Renseigner `quantity_amount` / `quantity_unit` pour les produits dont le
  fournisseur n'a pas déclaré de `weight_kg` — le backfill de la migration ne
  couvre que ceux-là.
- Corriger à la source les deux défauts du § 3 dans les scrapers concernés
  (`scripts/scrape/holzhof24`, `frankenbrennstoffe`) : c'est le mapping
  prix ↔ conditionnement qui est inversé, pas le prix.
- Ajouter un garde-fou d'import : rejeter en revue tout combustible dont le €/t
  calculé sort d'une fourchette déclarée par famille.
