# Spécification UX/UI de la boutique

## Contrat

Cette spécification couvre la boutique publique, le compte, le checkout et les surfaces de service. Elle se lie à `DESIGN.md`.

Every screen must read as the same product if placed side by side.

## Architecture de navigation

Navigation primaire, maximum cinq entrées :

1. `Sortiment` : Brennholz, Pellets, Briketts, Zubehör.
2. `Kaminöfen`.
3. `Liefergebiet`.
4. `Ratgeber`.
5. `Über uns`.

Actions utilitaires : recherche, compte, favoris et panier. Sur mobile : menu, logo, recherche, panier.

Le footer porte les liens de service et juridiques complets, sans surcharger le header.

## Flow : découvrir et commander

### Objectif

Permettre à un client allemand de comprendre un produit, vérifier sa livraison et commander avec un total final clair.

### Entrées

- accueil ;
- catalogue ou recherche ;
- page SEO locale valide ;
- lien direct produit ;
- article du guide.

### Parcours

```text
Accueil ou catalogue
  → filtres et comparaison
  → fiche produit
  → variante et quantité
  → code postal
  ◇ livrable ?
     ├─ non : conditions + contact ou autre zone
     └─ oui : devis + contraintes
  → panier
  → checkout en cinq étapes
  → paiement
  ◇ confirmé par le serveur ?
     ├─ non : état récupérable
     └─ oui : confirmation + suivi + document disponible
```

### États et sorties

| État | Affichage | Action |
| --- | --- | --- |
| chargement | skeleton conservant la géométrie | attendre ou annuler |
| catalogue vide | raison et filtres actifs | réinitialiser les filtres |
| produit indisponible | variante concernée, alternatives réelles | changer de variante |
| code invalide | erreur sous le champ | corriger |
| non livrable | zone et règle, aucun faux devis | contacter ou changer de code |
| devis expiré | total signalé comme obsolète | recalculer |
| paiement en cours | étape verrouillée, annonce `aria-live` | ne pas doubler l’envoi |
| paiement refusé | cause publique, panier préservé | réessayer ou changer de moyen |
| hors ligne | bandeau persistant, mutations bloquées | réessayer en ligne |
| session expirée | retour de connexion conservé | s’authentifier ou continuer en invité |
| succès | numéro, résumé, prochaine étape | suivre ou continuer |

Rafraîchir en checkout restaure les données non sensibles. Le bouton retour revient à l’étape précédente sans perdre les champs. Les données de paiement ne sont jamais persistées localement par l’application.

## Accueil

### Au-dessus de la ligne

- announcement bar ;
- header compact ;
- hero en grille 7/5 ;
- photo de contexte réelle ou placeholder autorisé ;
- titre `Wärme, die bei Ihnen ankommt.`;
- texte court ;
- CTA primaire `Brennholz bestellen` ;
- CTA secondaire `Kaminöfen entdecken` ;
- `DeliveryChecker` appuyé par la `Holzschnitt-Leiste`.

Sur mobile, le calculateur vient immédiatement après le texte, avant le média secondaire.

### Séquence

1. bande de preuves en ligne divisée ;
2. catégories en mosaïque asymétrique ;
3. produits populaires en grille 4/2/1 ;
4. poêles en composition éditoriale avec table de trois attributs ;
5. quatre étapes seulement dans une ligne progressive ;
6. section unité/qualité en image + texte ;
7. livraison avec zones schématiques, sans prétendre couvrir toute l’Allemagne ;
8. avis fictifs clairement présentés comme données de démonstration tant qu’ils ne sont pas réels ;
9. guides ;
10. newsletter avec consentement distinct.

## Catalogue

### Desktop

- fil d’Ariane, titre, introduction et compteur ;
- colonne filtres 280 px ;
- barre tri et filtres actifs ;
- grille 3 colonnes, 4 à partir de 1440 px si les cartes restent lisibles ;
- `Mehr anzeigen` préféré à une pagination opaque lorsque la stratégie SEO le permet.

### Mobile

- compteur + boutons `Filtern` et `Sortieren` ;
- drawer plein écran accessible ;
- grille une colonne ;
- barre de comparaison au-dessus de la safe area.

### Carte bois

Données dans cet ordre :

1. média et favori ;
2. badge factuel ;
3. nom ;
4. essence, longueur, humidité ;
5. quantité et unité explicitée ;
6. prix TTC et prix de base ;
7. stock et délai ;
8. action.

### Carte poêle

Données dans cet ordre :

1. média studio ;
2. marque et modèle ;
3. classe énergétique si vérifiée ;
4. puissance, rendement, combustible, raccord ;
5. prix TTC et délai ;
6. `Details ansehen` ;
7. comparaison et favori comme actions secondaires.

Une sélection de comparaison est limitée à quatre et annoncée aux technologies d’assistance.

## Fiche produit

### Zone d’achat

- breadcrumbs ;
- galerie ;
- titre et référence ;
- prix, prix de base et TVA ;
- attributs essentiels sous forme de liste divisée ;
- variantes ;
- quantité ;
- stock et délai ;
- code postal et devis ;
- CTA.

Sur mobile, un CTA collant présente nom court, prix et action sans masquer les réglages.

### Bois

Accordéons : `Beschreibung`, `Technische Angaben`, `Mengeneinheiten`, `Lieferung`, `Lagerung`, `Häufige Fragen`.

Le bloc `Was bedeutet Schüttraummeter?` utilise un schéma simple et un texte. Il ne propose aucune conversion universelle.

### Poêle

Afficher avant l’achat :

- puissance nominale ;
- rendement ;
- combustible autorisé ;
- raccord ;
- dimensions et poids ;
- conformité uniquement documentée ;
- avertissement de contrôle professionnel.

Les documents sont des liens secondaires clairement nommés. Les sections techniques utilisent une table définition/valeur, transformée en liste sur mobile.

## Comparateur

- quatre colonnes maximum ;
- première colonne d’attributs collante sur desktop ;
- cartes synthétiques suivies d’une matrice ;
- sur mobile, chaque attribut affiche les produits côte à côte dans un scroll horizontal avec en-têtes collants ;
- différences mises en évidence par graisse et fond `elevated`, jamais par un verdict `meilleur`.

## Panier

- lignes divisées, sans carte dans une carte ;
- modification de quantité avec état optimiste réconcilié par le serveur ;
- suppression réversible pendant quelques secondes ;
- devis livraison et contraintes visibles ;
- résumé collant sur desktop ;
- total, TVA et livraison séparés ;
- recommandations en dessous, jamais précochées.

## Checkout

Étapes :

1. `Kontaktdaten`
2. `Lieferadresse`
3. `Lieferart`
4. `Zahlung`
5. `Prüfen und bestellen`

Maximum quatre champs visibles par groupe. Chaque étape a un seul CTA primaire. Les erreurs sont placées sous le champ et résumées en haut avec liens de focus.

La dernière étape montre les caractéristiques essentielles, adresse, service, moyen, total, TVA, AGB/Widerruf et consentements non précochés.

Le libellé final est exactement `Zahlungspflichtig bestellen`.

## Livraison et installation

`/liefergebiet` commence par le code postal, puis présente seulement les conditions de la zone trouvée.

`/montage-und-inbetriebnahme` compare :

- `Nur Lieferung` ;
- `Lieferung mit Montagevermittlung` ;
- `Lieferung und Montage`.

La comparaison est une table de prestations, pas trois cartes. Toute option absente est nommée. Aucun tutoriel autonome d’installation.

## Compte et suivi

- compte : résumé de commande récente, favoris et adresses ;
- suivi : numéro + donnée de vérification, puis timeline publique ;
- masquer l’adresse ;
- ne jamais exposer notes internes, IDs prestataire ou événements techniques ;
- les changements de statut sont annoncés en `aria-live="polite"`.

## Contenu et légal

- guide : grille éditoriale avec catégories ;
- article : largeur 68 ch, sommaire collant sur grand écran ;
- FAQ : accordéons Radix ;
- pages légales : largeur 46 rem, sommaire, mise à jour et impression ;
- cookie banner : `Alle akzeptieren` et `Alle ablehnen` ont la même importance visuelle ; options facultatives désactivées.

## Composants

### `Button`

- Variants : `primary`, `secondary`, `ghost`, `destructive`.
- Tailles : 40, 44 et 48 px.
- Loading conserve la largeur et expose `aria-busy`.
- Focus : anneau 3 px avec offset 2 px.
- Aucun bouton désactivé sans explication quand l’action attend une condition.

### `DeliveryChecker`

- Props : `postcode`, `status`, `quote`, `constraints`, `onSubmit`.
- États : idle, validating, loading, available, unavailable, invalid, expired, error.
- Le résultat est une région `aria-live="polite"`.
- Entrée `inputmode="numeric"`, `autocomplete="postal-code"`, cinq chiffres.
- Un devis disponible affiche prix, délai, minimum, déchargement et expiration.

### `ProductCard`

- Variants : wood, pellet, briquette, stove, accessory.
- Les attributs sont configurés par type, pas une liste libre.
- Image ratio stable pour éviter CLS.
- Le favori a un nom accessible incluant le produit.
- Stock n’est jamais transmis par couleur seule.

### `PriceDisplay`

- Affiche prix TTC, devise, prix de base et lien livraison.
- Chiffres tabulaires.
- Accepte des centimes entiers, jamais un float.
- Les remises montrent le prix antérieur seulement lorsque la règle légale est satisfaite.

### `FilterDrawer`

- Radix Dialog/Drawer.
- Focus piégé, titre programmatique, fermeture Escape.
- Résultats estimés sur le CTA.
- `Zurücksetzen` reste secondaire.

### `ComparisonBar`

- Visible à partir d’un produit.
- Compteur textuel, retirer et comparer.
- Limite quatre avec message explicite.
- Safe area mobile respectée.

### `CheckoutStepper`

- `nav` avec liste ordonnée.
- Étape courante via `aria-current="step"`.
- Changements annoncés et focus sur le `h1`.
- Ne permet pas de sauter une étape invalide.

### `OrderTimeline`

- Liste ordonnée avec date et texte.
- Étapes non atteintes libellées, pas seulement grisées.
- Événements publics uniquement.

### `CookieBanner`

- Dialogue non modal tant que la navigation reste possible.
- Trois actions lisibles.
- Préférences détaillées en Dialog.
- `Notwendig` verrouillé ; autres catégories off.

## Responsive et accessibilité

- Touch targets : 48 px minimum.
- Skip link, landmarks et un seul `h1`.
- Focus jamais masqué par un sticky header.
- Zoom 200 % sans scroll horizontal global.
- Table technique remplacée par `dl` sur petit écran.
- Toasts en `aria-live="polite"` ; erreurs bloquantes en `assertive`.
- Les changements de panier annoncent produit, quantité et total.
- Images ont un alt informatif ; images décoratives ont `alt=""`.

## Tests visuels et interaction

- 360, 390, 768, 1024, 1280 et 1536 px.
- Clavier complet : header → catalogue → fiche → panier → checkout.
- Lecteur d’écran : devis, erreurs, comparaison, panier et progression.
- Reduced motion.
- Longs noms allemands et prix à quatre chiffres.
- Produit sans image, stock faible, document manquant, devis expiré.
- LCP image priorisée uniquement sur le hero ; autres images lazy.

## Pré-Flight

### Résultat

- [x] Valeurs visuelles uniquement issues de `DESIGN.md`.
- [x] Une palette, une paire typographique, une échelle de rayon, Lucide.
- [x] Zéro fonte ou cliché couleur interdit.
- [x] Zéro hero centré sombre, carte imbriquée ou rangée monotone de trois cartes.
- [x] Signature `Holzschnitt-Leiste` présente et limitée.
- [x] États loading, empty, error, partial et success couverts.
- [x] Refresh, retour, expiration, session et hors ligne couverts.
- [x] Contrastes et focus documentés.
- [x] Clavier, annonces, touch targets et reduced motion documentés.
- [x] Au moins trois familles de composition sur la page d’accueil.
- [x] Navigation primaire à cinq entrées et formulaires groupés.
- [x] Une action primaire par vue.

### Auto-critique

| Axe | Score / 4 |
| --- | --- |
| caractère distinctif | 3 |
| hiérarchie et focus | 4 |
| cohérence avec `DESIGN.md` | 4 |
| accessibilité | 4 |
| états et cas limites | 4 |
| qualité du texte | 3 |
| retenue | 4 |
| motivation du mouvement | 4 |

Total : `30/32`. Aucun axe inférieur ou égal à 2. Aucun correctif de gate requis.

## Handoff de construction

- Agent cible : `nextjs-senior-engineer`.
- Design system : Radix primitives + shadcn/ui.
- Setup : installer les primitives nécessaires au fur et à mesure, puis les thèmer via variables CSS/Tailwind dérivées de `DESIGN.md`.
- Instruction : Implement exactly this spec. Theme the design system with our locked tokens; do NOT redesign or re-implement its components.

Critères d’acceptation :

- toutes les routes du PRD ont un état navigable ;
- allemand visible partout ;
- aucune valeur visuelle hors tokens ;
- parcours critique clavier et mobile fonctionnel ;
- états obligatoires présents ;
- données fictives signalées ;
- aucun backend simulé présenté comme preuve d’une intégration réelle ;
- tests d’accessibilité automatisés sans erreur critique ;
- smoke tests Playwright sur accueil, catalogue, fiche, panier et checkout.
