# Guide de scraping produits

Dernière mise à jour : 28 juillet 2026
Source parente : [../Sources_Produits_Bois_Poeles_Allemagne.md](../Sources_Produits_Bois_Poeles_Allemagne.md)

Ce document opérationnalise l'extraction de données produit pour construire le catalogue HOLZKRAFT. Il définit **quoi** on scrape, **comment**, et **ce qui est légalement acceptable** avant obtention d'un accord revendeur.

---

## 1. Cadre juridique (à respecter sans exception)

### Faits vs. contenu protégé

| Élément | Statut | Utilisation |
| --- | --- | --- |
| Nom du modèle, marque, EAN, SKU | Fait / marque déposée | Citation autorisée en contexte revendeur, sans imiter la mise en page ; jamais dans un domaine ou marque HOLZKRAFT |
| Puissance kW, rendement %, dimensions mm, poids kg | Faits techniques | Extraction et affichage libres — pas de copyright sur les valeurs |
| Classe énergétique, émissions CO/OGC/poussières | Faits réglementaires | Extraction et affichage libres, mention de la source de mesure |
| Description commerciale, textes marketing | Œuvre littéraire | **Interdit** de copier ; à réécrire intégralement. Le texte source est capté dans `descriptions.long_de_raw` avec `long_de_authorized: false` — pour traçabilité et extraction de faits, jamais pour publication. |
| Liste d'équipement (« Eigenschaften ») | Désignations factuelles | Réutilisables : ce sont des termes techniques courts, pas de la prose. Intégrés dans nos propres phrases par `scripts/db/_lib/describe.mjs`. |
| Photographies produit | Œuvre + droit voisin | **Interdit** de télécharger/republier sans autorisation écrite |
| Logo, charte visuelle | Marque + œuvre | **Interdit** de reproduire hors contexte revendeur autorisé |
| Notice PDF, fiche technique PDF | Œuvre | Consultation libre, republication interdite ; les valeurs peuvent être extraites |

### Règles générales

1. Respecter `robots.txt` de chaque source. Vérifier avant chaque nouveau scrape.
2. User-Agent explicite `HOLZKRAFT-Catalog-Bot/1.0 (contact@holzkraft.de)` (à remplacer par l'e-mail réel une fois défini).
3. Débit : **1 requête / 3 secondes maximum** par domaine, backoff exponentiel sur 429/503.
4. Cache disque local (`data/scraped/_cache/`) pour ne pas re-tirer une page inchangée sous 24 h.
5. Stocker `source_url`, `scraped_at`, `content_hash` sur chaque ligne extraite.
6. **Jamais** de téléchargement d'image ou de PDF vers `public/` ou Cloudinary avant autorisation écrite du détenteur.
7. Le champ `authorized: false` reste par défaut sur toute donnée scrapée ; un produit n'est publiable qu'après passage à `true` avec référence à l'e-mail/contrat de l'autorisation.
8. Aucune donnée scrapée ne se retrouve dans un commit tant qu'elle n'est pas revue par un humain. Le dossier `data/scraped/` est **gitignoré**.
9. Si un site oppose une CAPTCHA ou un blocage anti-bot, **arrêter** et demander un accès légitime.

Rappels PRD/AGENTS non contournables :

- Interdiction des faux certificats, faux badges, faux avis.
- Les données réglementaires (BImSchV, Ecodesign, étiquette énergétique) doivent provenir du fabricant ou du registre HKI CERT — **jamais** d'un marchand tiers.
- Un produit réglementé n'est publiable que si son dossier de conformité est complet et vérifié.

---

## 2. Priorité de sources (roadmap)

Trois vagues, du plus sûr juridiquement au plus sensible.

### Vague 1 — Registres publics et référentiels ouverts (démarrage)

Aucun risque : ce sont des données publiques ou légalement obligatoires. Elles servent à **construire l'ossature du catalogue** (marques, modèles homologués, valeurs limites).

| # | Source | URL | Méthode | Données ciblées |
| - | --- | --- | --- | --- |
| 1 | HKI CERT — Herstellerliste | https://www.cert.hki-online.de/de/geraete/hersteller-liste | Scrape HTML | Liste des fabricants enregistrés |
| 2 | HKI CERT — Geräteliste | https://www.cert.hki-online.de/de/geraete | Scrape HTML (paginé) | Modèles + puissance + rendement + émissions + statut BImSchV |
| 3 | Ecodesign 2015/1185 | https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32015R1185 | Lecture PDF/HTML | Valeurs limites de référence |
| 4 | Étiquette énergétique 2015/1186 | https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32015R1186 | Lecture PDF/HTML | Barème A++ → G, obligations d'affichage |
| 5 | 1. BImSchV | https://www.gesetze-im-internet.de/bimschv_1_2010/ | Lecture HTML | Valeurs limites CO/OGC/poussières |

### Vague 2 — Sites fabricants (données produit officielles)

Risque modéré. On peut lire librement, on peut extraire les **valeurs techniques**, mais on ne republie ni image ni description sans autorisation. Envoyer en parallèle l'e-mail type de [Sources_Produits section 6](../Sources_Produits_Bois_Poeles_Allemagne.md).

| # | Source | URL catalogue | Méthode | À extraire |
| - | --- | --- | --- | --- |
| 6 | Spartherm | https://www.spartherm.com/de/kaminoefen/ | Scrape HTML + fiches PDF | Modèle, puissance, rendement, raccord, dimensions, EAN si publié |
| 7 | Camina & Schmid | https://camina-schmid.de/kaminoefen | Scrape HTML | Modèle, spécifications, lien fiche PDF |
| 8 | Austroflamm | https://www.austroflamm.com/de/kaminoefen | Scrape HTML | Idem |
| 9 | RIKA | https://www.rika.de/de/kaminoefen | Scrape HTML | Idem |
| 10 | Jøtul DE | https://www.jotul.com/de/produkte/kaminoefen | Scrape HTML | Idem |
| 11 | Wodtke | https://www.wodtke.com/de/produkte/kaminofen | Scrape HTML | Idem |
| 12 | Skantherm | https://www.skantherm.de/produkte | Scrape HTML + configurateur JS (Playwright) | Idem + variantes de finition |
| 13 | Max Blank | https://www.maxblank.com/produkte/kaminoefen | Scrape HTML | Idem |
| 14 | Attika | https://attika.ch/de/produkte | Scrape HTML | Idem (marché CH — vérifier compatibilité DE) |
| 15 | Ofen Koppe | https://www.ofenkoppe.com/kaminoefen | Scrape HTML | Idem |
| 16 | H&M Germany | https://www.hmgermany.de/downloads/ | Lecture PDF | Attestations, données de conformité |

### Vague 3 — Aggregateurs et boutiques de référence

Risque élevé : ces sites ont réécrit et enrichi les données, donc **leurs textes sont protégés**. On les utilise pour :

- **Comprendre la structure** attendue par le marché DE (filtres, attributs, mise en page fiche).
- **Vérifier des références croisées** (est-ce que le modèle X est vraiment disponible en DE ?).
- **Repérer** les gammes de prix pratiquées (données de marché, non copyrightables).

⚠️ Mise à jour 31/07/2026 : l'autorisation utilisateur couvre désormais ces
sources (scope `specs`/`images`/`videos`/`pdf`, voir `data/licenses.json`),
mais l'usage prévu reste la structure de catalogue et les fourchettes de prix.
Ne pas copier descriptions, avis ni badges ; tout média agrégateur téléchargé
doit être revalidé par revue humaine avant publication.

| # | Source | URL | Méthode | À extraire (uniquement) |
| - | --- | --- | --- | --- |
| 17 | Ofen.de | https://www.ofen.de/kaminoefen | Scrape HTML | Structure catégorie/filtres, fourchette de prix |
| 18 | Kaminofen-Shop | https://kaminofen-shop.de/ | Scrape HTML | Idem |
| 19 | Feuerdepot | https://www.feuerdepot.de/ | Scrape HTML | Idem |
| 20 | Feuer-Fuchs | https://www.feuer-fuchs.de/ | Scrape HTML | Idem |
| 21 | Kaminofen-Shop24h | https://www.kaminofen-shop24h.de/ | Scrape HTML | Idem |

### Vague 4 — Fournisseurs bois de chauffage

Le bois se vend en local. Priorité : identifier **un** fournisseur régional réel qui devient notre partenaire ; scraper les autres uniquement pour comprendre le format allemand (Rm/Srm/kg, longueurs 25/33/50, humidité < 20 %).

| # | Source | URL | Méthode | À extraire |
| - | --- | --- | --- | --- |
| 22 | Holzhof24 | https://holzhof24.de/brennholz/ | Scrape HTML | Essence, longueur, unité, prix par unité, palette |
| 23 | Franken Brennstoffe | https://www.frankenbrennstoffe.de/Brennstoffe/Sortiment/Brennholz/ | Scrape HTML | Idem |
| 24 | Holzmüller | https://www.holzmueller-shop.de/ | Scrape HTML | Idem |
| 25 | JSM Brennholz | https://jsm-brennholz.de/ | Scrape HTML | Idem |
| 26 | Brennio | https://www.brennio.de/ | Scrape HTML | Idem — marketplace, à croiser avec fournisseurs |
| 27 | Holzfront | https://holzfront.de/ | Scrape HTML | Idem |
| 28 | Kaminholz Berlin | https://www.kaminholz-berlin.com/ | Scrape HTML | Idem — zone Berlin utile pour pilote |

### Grossistes (non scrapables sans accès)

Seidel & Eckert, Schornsteinwelt Großhandel, Hagos exigent un compte revendeur. **Ne pas scraper** — demander l'accès via l'e-mail type.

---

## 3. Ordre d'exécution recommandé

```text
Étape 1  ─  Vague 1 (registres) : bâtir la liste blanche de modèles homologués DE
Étape 2  ─  Envoyer en parallèle les demandes d'accès revendeur (Vague 2 + grossistes)
Étape 3  ─  Vague 2 (fabricants) : extraire spécifications techniques par modèle
Étape 4  ─  Croisement Vague 1 ↔ Vague 2 : ne garder que les modèles présents dans les deux
Étape 5  ─  Vague 3 (aggregateurs) : sonder prix moyens, structure UX
Étape 6  ─  Vague 4 (bois) : identifier un fournisseur régional pilote
Étape 7  ─  Créer les produits dans Supabase avec `authorized: false` par défaut
Étape 8  ─  Activation produit par produit à mesure que les autorisations arrivent
```

---

## 4. Format de sortie attendu

Chaque scraper écrit dans `data/scraped/{source-slug}/{yyyy-mm-dd}.jsonl` (une ligne = un enregistrement). Structure minimale :

```json
{
  "source": "hki-cert",
  "source_url": "https://www.cert.hki-online.de/de/geraete/12345",
  "scraped_at": "2026-07-28T20:15:00Z",
  "content_hash": "sha256:…",
  "type": "stove",
  "brand": "Spartherm",
  "model": "Passo Xtra",
  "identifiers": { "ean": "…", "sku": "…", "hki_id": "…" },
  "technical": {
    "power_kw": 6.5,
    "efficiency_pct": 84,
    "energy_class": "A+",
    "flue_diameter_mm": 150,
    "co_mg_nm3": 1150,
    "particulates_mg_nm3": 32
  },
  "compliance": {
    "bimschv_stufe": "2",
    "ecodesign_2022": true,
    "test_certificate_url": "…"
  },
  "media": {
    "image_urls": ["…"],
    "image_authorized": false
  },
  "commercial": {
    "description_raw": "…",
    "description_authorized": false,
    "price_cents_market_ref": null,
    "price_source": null
  },
  "authorized": false,
  "review_status": "pending"
}
```

Champs obligatoires : `source`, `source_url`, `scraped_at`, `authorized`, `review_status`.
`review_status` ∈ {`pending`, `approved`, `rejected`, `superseded`}.

---

## 5. Stack technique proposée

| Besoin | Outil | Justification |
| --- | --- | --- |
| HTTP simple + robots.txt | `undici` + `robots-parser` | Natif Node 20, très rapide |
| HTML statique | `cheerio` | jQuery-like, léger, suffisant pour 80 % des sites |
| Sites JS-heavy (configurateur, filtres AJAX) | `playwright` déjà installé | Réutilise l'infra e2e |
| Extraction PDF (fiches techniques) | `pdfjs-dist` | Extraction texte structuré |
| Rate limit / retries | `p-queue` + backoff maison | Contrôle fin par domaine |
| Validation | `zod` (à ajouter) | Enforcer le schéma de sortie |

À installer plus tard : `pnpm add -D cheerio undici robots-parser p-queue pdfjs-dist zod`.

Les scrapers vivent dans `scripts/scrape/` avec un fichier par source :

```
scripts/scrape/
  _lib/
    fetcher.mjs     # HTTP + cache + rate limit + robots.txt
    schema.mjs      # zod du record scrapé
  hki-cert.mjs
  spartherm.mjs
  ofen-de.mjs
  ...
```

Point d'entrée unique : `pnpm run scrape:<source>` → écrit dans `data/scraped/<source>/`.

---

## 6. Ce qui n'est **pas** dans ce guide

- **Upload d'images** : jamais depuis un scrape. Utiliser `pnpm run upload:image` seulement pour des sources dont nous détenons la licence.
- **Import automatique en base** : jamais. Un humain revoit chaque enregistrement `pending` → `approved`.
- **Contact automatique** : les e-mails aux fabricants restent envoyés manuellement pour préserver la relation commerciale.

---

## 7. Suivi opérationnel

Créer un fichier `data/scraped/_STATUS.md` (gitignoré) qui liste :

- Vague en cours.
- Sources terminées, en cours, échouées (avec raison : blocage, changement de structure, absence de robots.txt permissif).
- Modèles collectés / approuvés / publiés.
- Autorisations reçues par fournisseur.

Ce fichier est le tableau de bord humain avant l'admin Supabase.

---

## État et prochaine action

### Autorisations (31 juillet 2026)

`data/licenses.json` couvre désormais **toutes les sources** : les 10 fabricants
(austroflamm, camina, hark, jotul, maxblank, ofenkoppe, rika, skantherm,
spartherm, wodtke), les 5 agrégateurs Vague 3 et les 7 fournisseurs de bois
Vague 4. Scope : `specs`, `images`, `videos`, `pdf`. Évidence : déclaration de
l'utilisateur du 31/07/2026, **contrat écrit à référencer ultérieurement**
(« on le fera plus tard, scrape d'abord »).

Chaque scraper lit sa licence via `getLicense(source, kind)`
(`scripts/scrape/_lib/licenses.mjs`) et ne télécharge que ce qui est autorisé.

### Vagues 1–2 — état au 31 juillet 2026

| Source | Statut | Enregistrements `2026-07-31.jsonl` |
| --- | --- | --- |
| HKI CERT | implémenté | 77 fabricants, 1 360 entrées Spartherm (rapprochement 22/28 + 6 manquants) |
| Spartherm | scrapé | 28 produits importés en staging |
| HARK | scrapé | 59 produits importés en staging |
| RIKA | scrapé `--all` | 40 |
| Austroflamm | scrapé `--all` | 72 |
| Jøtul | scrapé `--all` | 137/146 (9 catégories sans fiche produit) |
| Wodtke | scrapé `--all` | 37 |
| Max Blank | scrapé `--all` | 74/86 (1 page en erreur HTTP 500 consignée `_errors.jsonl`) |
| Ofen Koppe | scrapé `--all` | 10 |
| Skantherm | scrapé `--all` | 20 |
| Camina & Schmid | scrapé `--all` | 49 |

Tous les enregistrements restent `review_status: pending` : **aucune donnée
scrapée n'est publiée ni importée en base avant revue humaine**. Le dossier
`data/scraped/` est gitignoré.

### Vague 4 — fournisseurs de bois, état au 1er août 2026

| Source | Enregistrements | Images | Exclusions |
| --- | --- | --- | --- |
| Brennio | 118 | 118 | — |
| Kaminholz Berlin | 23 | 23 | — |
| Holzhof24 | 23 | 23 | — |
| Holzfront | 25 | 22 | 2 services, 1 bon cadeau |
| JSM Brennholz | 9 | 9 | — |
| Franken Brennstoffe | 9 | 9 | — |
| Holzmüller | 8 | 8 | — |

### Vague 3 — ofen.de (1er août 2026)

Premier agrégateur implémenté, parce qu'il comble le seul manque qu'aucun
marchand de bois ne couvre : les accessoires poêle (Ofenrohr, Bodenplatte,
Funkenschutzgitter, Kaminbesteck, Ventilatoren, Aschesauger…), et parce qu'il
affiche des prix de détail publics là où 8 fabricants sur 10 n'en publient pas.

Particularités du site :

- **Découverte par sitemap obligatoire.** `robots.txt` contient `Disallow: */?`,
  donc la pagination des catégories (`?p=2`) est interdite. Le sitemap produit
  est gzippé et liste 6 379 articles.
- Le scraper ne récolte que les groupes utiles (`--group accessory|stove`) ;
  parcourir les 6 379 fiches à 1 requête/2 s n'aurait aucun intérêt.
- **Le prix doit être lu dans `product:price:amount`.** Le premier « …,… € » du
  HTML appartient à un encart de vente croisée.
- **Les images doivent être filtrées par rapprochement avec le titre.** La page
  sert ~60 vignettes de méga-menu depuis `/media/` ; sans filtre on obtenait
  41 images par article.
- Un scraper peut écrire plusieurs fichiers pour une même date
  (`2026-08-01-accessory.jsonl`, `-stove.jsonl`) ; le publieur de médias et
  l'importeur lisent désormais tous les fichiers de la date la plus récente.

### Pipeline générique (1er août 2026)

```bash
node scripts/scrape/<source>.mjs --all      # 1. extraction
pnpm run publish:media -- --source <source> # 2. médias -> Cloudinary
pnpm run db:import:source -- --source <source>  # 3. import staging
```

`--all` traite toutes les sources. `--dry-run` sur l'import affiche le
décompte sans écrire. Chaque produit reste `is_published = false` et
`review_status = pending`.

Règles appliquées par `_lib/wood.mjs` :

- essence, longueur, humidité et unité sont détectées **sur le titre seul** ;
  la description mentionne d'autres essences et fausse la déclaration ;
- `detectProductKind` sépare wood / kindling / briquette / pellet / accessory ;
- les services (livraison, empilage) et bons cadeaux reçoivent `skip_import` et
  ne deviennent jamais des produits ;
- `dedupeSlugs` désambiguïse les offres distinctes qui partagent un `h1`.

### Prochaines actions

- Vague 3 : scrapers agrégateurs, si et seulement si l'on veut mesurer les
  fourchettes de prix du marché — ce ne sont pas des sources produit ;
- revue humaine des 739 enregistrements `pending` avant publication ;
- référencer le contrat écrit dans `data/licenses.json` dès qu'il est disponible.
