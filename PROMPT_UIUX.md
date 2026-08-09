Crée uniquement l’interface utilisateur complète d’une boutique e-commerce allemande spécialisée dans la vente de bois de chauffage et de poêles à bois.

IMPORTANT : génère uniquement l’UI/UX et le frontend visuel. Ne crée aucun backend, aucune base de données, aucune authentification réelle, aucune API, aucun système de paiement fonctionnel et aucune logique serveur. Toutes les interactions doivent utiliser des données fictives locales et des états simulés.

## 1. Informations générales

Nom temporaire de la marque : HOLZKRAFT
Marché : Allemagne
Langue de toute l’interface : allemand
Devise : EUR
Type de site : boutique e-commerce premium
Produits vendus :

* Brennholz
* Kaminholz
* Kaminöfen
* Holzöfen
* Anzündholz
* Holzbriketts
* Ofenrohre
* Funkenschutzplatten
* Kaminbesteck
* Zubehör
* Ersatzteile

Le site doit inspirer confiance, qualité, chaleur, proximité, sérieux et durabilité.

## 2. Contraintes techniques

Créer uniquement un frontend avec :

* Next.js avec App Router
* TypeScript
* Tailwind CSS
* composants réutilisables
* Lucide Icons
* données fictives locales
* images avec placeholders réalistes
* interface totalement responsive
* desktop, tablette et mobile
* animations légères et professionnelles
* aucun backend
* aucune API externe
* aucune base de données
* aucun vrai paiement
* aucune authentification réelle

Simuler localement :

* l’ajout au panier ;
* la modification des quantités ;
* les favoris ;
* les filtres ;
* la recherche ;
* le calcul de livraison par code postal ;
* le changement de variantes ;
* les étapes du checkout ;
* la connexion ;
* les menus ;
* les accordéons ;
* les notifications ;
* les états de chargement ;
* les erreurs ;
* le succès d’une commande.

## 3. Direction artistique

Créer un design naturel, chaleureux, premium et moderne.

Palette recommandée :

* vert forêt principal : `#173F35`
* vert profond : `#0F2D26`
* brun bois : `#8A5A3B`
* brun foncé : `#4C3427`
* beige chaud : `#F3EBDD`
* crème : `#FAF7F1`
* orange feu utilisé avec modération : `#D96832`
* gris texte : `#4F514C`
* blanc : `#FFFFFF`
* noir doux : `#1D211E`

Style :

* grandes photographies naturelles ;
* bois empilé, bûches séchées, poêles modernes et intérieurs chaleureux ;
* sections aérées ;
* cartes avec bordures fines ;
* ombres douces ;
* rayons de bordure entre 10 et 16 px ;
* boutons solides et rassurants ;
* badges techniques discrets ;
* icônes simples ;
* très peu de glassmorphism ;
* aucune surcharge visuelle ;
* aucun effet futuriste ;
* pas de dégradés multicolores ;
* pas de design générique de startup SaaS.

Typographie :

* titres : une police serif élégante ou une sans-serif expressive ;
* textes et éléments UI : une sans-serif très lisible ;
* hiérarchie typographique forte ;
* grands titres mais sans prendre tout l’écran.

## 4. Accessibilité

L’interface doit viser WCAG 2.2 AA :

* contrastes lisibles ;
* focus clavier visible ;
* boutons avec labels explicites ;
* champs avec labels permanents ;
* messages d’erreur sous les champs ;
* navigation au clavier ;
* zones tactiles suffisamment grandes ;
* aucune information transmise uniquement par une couleur ;
* textes alternatifs prévus pour les images ;
* respect de `prefers-reduced-motion` ;
* structure HTML sémantique ;
* titres organisés correctement.

## 5. Structure globale

Créer un bandeau supérieur discret :

`Kostenlose Lieferung ab 999 € in ausgewählten Regionen`

Créer un header desktop avec :

* logo HOLZKRAFT ;
* lien `Brennholz` ;
* lien `Kaminöfen` ;
* lien `Zubehör` ;
* lien `Liefergebiet` ;
* lien `Ratgeber` ;
* lien `Über uns` ;
* icône de recherche ;
* icône de compte ;
* icône de favoris ;
* panier avec compteur.

Créer un header mobile avec :

* menu hamburger ;
* logo ;
* recherche ;
* panier.

Le header doit devenir légèrement compact et rester visible au scroll.

Créer un footer complet avec :

Colonne `Sortiment` :

* Brennholz
* Kaminöfen
* Anzündholz
* Holzbriketts
* Zubehör

Colonne `Service` :

* Liefergebiet prüfen
* Versand und Zahlung
* Montage und Inbetriebnahme
* Bestellung verfolgen
* FAQ
* Kontakt

Colonne `Unternehmen` :

* Über uns
* Ratgeber
* Nachhaltigkeit
* Karriere

Colonne `Rechtliches` :

* Impressum
* Datenschutz
* AGB
* Widerrufsbelehrung
* Widerrufsformular
* Barrierefreiheit
* Cookie-Einstellungen

Ajouter :

* coordonnées de l’entreprise ;
* moyens de paiement ;
* badges de confiance ;
* inscription newsletter ;
* réseaux sociaux ;
* copyright ;
* mention des prix avec TVA.

## 6. Page d’accueil

Créer une page d’accueil premium et orientée conversion.

### Hero

Utiliser une grande image montrant un intérieur allemand chaleureux avec un poêle moderne et du bois empilé.

Titre :

`Wärme, die bei Ihnen ankommt.`

Sous-titre :

`Hochwertiges Brennholz und ausgewählte Kaminöfen – transparent beschrieben und zuverlässig geliefert.`

Boutons :

* `Brennholz bestellen`
* `Kaminöfen entdecken`

Ajouter un petit calculateur de zone de livraison :

Label :

`Liefern wir zu Ihnen?`

Champ :

`Postleitzahl eingeben`

Bouton :

`Liefergebiet prüfen`

Prévoir les états :

* code postal disponible ;
* zone non desservie ;
* code postal invalide ;
* chargement.

### Avantages

Afficher quatre avantages avec icônes :

* `Geprüfte Qualität`
* `Transparente Mengen`
* `Sichere Zahlung`
* `Zuverlässige Lieferung`

### Catégories principales

Créer de grandes cartes illustrées :

* `Brennholz`
* `Kaminöfen`
* `Anzündholz`
* `Holzbriketts`
* `Ofenzubehör`

### Produits populaires

Afficher un carrousel ou une grille de huit produits.

Exemples :

1. `Buchenholz, 25 cm, 1,8 Srm`
2. `Eichenholz, 33 cm, 1,7 Srm`
3. `Birkenholz im Karton, 20 kg`
4. `Anzündholz, 10 kg`
5. `Kaminofen Nordlicht 7`
6. `Kaminofen Bergen 5`
7. `Funkenschutzplatte Klarglas`
8. `Ofenrohr Set, Schwarz`

### Section poêles à bois

Titre :

`Der passende Kaminofen für Ihr Zuhause`

Texte :

`Vergleichen Sie Leistung, Wirkungsgrad, Design und technische Anforderungen unserer ausgewählten Modelle.`

Boutons :

* `Kaminöfen vergleichen`
* `Ofenberatung starten`

Afficher trois modèles de poêles avec :

* photo ;
* classe énergétique ;
* puissance ;
* rendement ;
* prix ;
* CTA.

### Fonctionnement

Créer quatre étapes :

1. `Produkt auswählen`
2. `Liefergebiet prüfen`
3. `Sicher bestellen`
4. `Lieferung erhalten`

### Section qualité du bois

Utiliser une photo en gros plan de bûches.

Afficher :

* essence ;
* humidité ;
* longueur ;
* conditionnement ;
* provenance ;
* explication de `Raummeter` et `Schüttraummeter`.

Titre :

`Sie wissen genau, was Sie bekommen.`

### Section livraison

Créer une carte visuelle simplifiée de l’Allemagne ou des zones régionales.

Titre :

`Lieferung mit klaren Bedingungen`

Afficher :

* code postal ;
* coût ;
* délai ;
* mode de déchargement ;
* livraison au bord du trottoir ou au lieu d’utilisation selon l’option.

### Témoignages

Afficher six avis allemands crédibles avec :

* prénom ;
* ville ;
* note ;
* produit acheté ;
* commentaire court.

Ne pas utiliser de faux logos de plateformes d’avis connues.

### Guides

Afficher trois articles :

* `Raummeter und Schüttraummeter erklärt`
* `Welche Holzart brennt am besten?`
* `So finden Sie den passenden Kaminofen`

### Newsletter

Titre :

`Tipps rund um Holz, Wärme und Kaminöfen`

Champ e-mail, checkbox de consentement non précochée et bouton `Anmelden`.

## 7. Catalogue de bois

Route visuelle : `/brennholz`

Créer :

* breadcrumbs ;
* titre ;
* introduction ;
* compteur de résultats ;
* filtres desktop en sidebar ;
* filtres mobile dans un drawer ;
* tri ;
* grille de produits ;
* pagination ou bouton `Mehr anzeigen`.

Filtres :

* Holzart
* Scheitlänge
* Feuchtigkeitszustand
* Verpackung
* Verkaufseinheit
* Preis
* Verfügbarkeit
* Lieferzeit

Options de tri :

* `Empfohlen`
* `Preis aufsteigend`
* `Preis absteigend`
* `Neueste Produkte`
* `Beliebteste Produkte`

Chaque carte produit de bois doit afficher :

* photo ;
* badge comme `Ofenfertig`, `Kammergetrocknet` ou `Bestseller` ;
* nom ;
* essence ;
* longueur ;
* humidité maximale ;
* quantité ;
* prix TTC ;
* prix de base ;
* mention `zzgl. Versandkosten` ;
* disponibilité ;
* bouton `In den Warenkorb` ;
* bouton favoris.

Créer aussi les états :

* aucun résultat ;
* filtres actifs ;
* chargement avec skeletons ;
* produit indisponible ;
* stock faible.

## 8. Fiche produit de bois

Route visuelle : `/produkt/buchenholz-25-cm`

Créer :

* breadcrumbs ;
* galerie avec miniatures ;
* zoom image ;
* badges ;
* titre ;
* note fictive ;
* référence ;
* prix ;
* prix de base ;
* mention TVA ;
* choix de longueur ;
* choix du conditionnement ;
* quantité ;
* stock ;
* délai ;
* champ code postal ;
* bouton `In den Warenkorb` ;
* bouton favoris.

Afficher un bloc de caractéristiques :

* `Holzart: Buche`
* `Scheitlänge: ca. 25 cm`
* `Restfeuchte: unter 20 %`
* `Lieferform: Palette`
* `Menge: 1,8 Schüttraummeter`
* `Herkunft: Deutschland`
* `Geeignet für: Kaminöfen und Kamine`

Ajouter des onglets ou accordéons :

* Beschreibung
* Technische Angaben
* Mengeneinheiten
* Lieferung
* Lagerung
* Häufige Fragen

Créer une section pédagogique :

`Was bedeutet Schüttraummeter?`

Ajouter :

* produits similaires ;
* accessoires ;
* avis clients ;
* guide de stockage.

## 9. Catalogue des poêles à bois

Route visuelle : `/kaminoefen`

Créer une interface plus technique mais toujours accessible.

Filtres :

* Leistung in kW
* Preis
* Energieeffizienzklasse
* Wirkungsgrad
* Brennstoff
* Bauart
* Rauchrohranschluss
* Rauchrohrdurchmesser
* Externe Luftzufuhr
* Raumluftunabhängig
* Material
* Farbe
* Hersteller
* Verfügbarkeit

Chaque carte de poêle doit afficher :

* image détourée ou photo studio ;
* marque ;
* modèle ;
* badge énergétique ;
* puissance nominale ;
* rendement ;
* combustible ;
* diamètre du raccord ;
* prix TTC ;
* délai ;
* disponibilité ;
* bouton `Details ansehen` ;
* bouton `Vergleichen` ;
* favoris.

Créer une barre de comparaison fixe lorsqu’au moins un produit est sélectionné :

`2 Kaminöfen ausgewählt`

Bouton :

`Jetzt vergleichen`

Limiter visuellement la comparaison à quatre produits.

## 10. Fiche produit d’un poêle

Route visuelle : `/kaminofen/nordlicht-7`

Créer une page détaillée premium.

Zone principale :

* breadcrumbs ;
* galerie ;
* badges `Ecodesign 2022`, `1. BImSchV Stufe 2` et classe énergétique ;
* marque ;
* modèle ;
* avis ;
* SKU ;
* prix TTC ;
* frais de livraison ;
* disponibilité ;
* délai ;
* choix de couleur ;
* quantité ;
* bouton `In den Warenkorb` ;
* bouton favoris ;
* bouton comparaison.

Afficher immédiatement :

* `Nennwärmeleistung: 7,0 kW`
* `Wirkungsgrad: 81 %`
* `Energieeffizienzklasse: A+`
* `Rauchrohr: Ø 150 mm`
* `Anschluss: oben / hinten`
* `Gewicht: 118 kg`
* `Brennstoff: Scheitholz`

Ajouter un avertissement bien visible mais non alarmiste :

`Vor Installation müssen Aufstellort, Schornstein und Verbrennungsluft durch einen qualifizierten Fachbetrieb und den zuständigen Bezirksschornsteinfeger geprüft werden.`

Boutons secondaires :

* `Technisches Datenblatt`
* `Energielabel`
* `Bedienungsanleitung`
* `Montage anfragen`

Créer une section technique complète avec un tableau clair :

* Hersteller
* Modell
* Nennwärmeleistung
* Leistungsbereich
* Wirkungsgrad
* Energieeffizienzklasse
* Brennstoff
* Scheitholzlänge
* Rauchrohrdurchmesser
* Rauchrohranschluss
* Abgastemperatur
* Abgasmassenstrom
* Förderdruck
* Außenluftanschluss
* Maße
* Gewicht
* Sicherheitsabstände
* Emissionswerte

Créer les sections :

* `Beschreibung`
* `Technische Daten`
* `Sicherheit und Abstände`
* `Lieferumfang`
* `Lieferung`
* `Montage und Abnahme`
* `Dokumente`
* `Herstellerinformationen`
* `Häufige Fragen`

Ajouter une section d’accessoires compatibles :

* tuyau ;
* plaque de protection ;
* kit de raccordement ;
* serviteur de cheminée.

Chaque accessoire doit indiquer si la compatibilité doit être vérifiée.

## 11. Comparateur de poêles

Route visuelle : `/kaminoefen-vergleichen`

Créer un tableau responsive permettant de comparer jusqu’à quatre poêles.

Sur mobile, utiliser des cartes ou un tableau horizontal scrollable.

Comparer :

* photo ;
* prix ;
* classe énergétique ;
* puissance ;
* rendement ;
* combustible ;
* dimensions ;
* poids ;
* raccord ;
* arrivée d’air ;
* distances ;
* émissions ;
* disponibilité ;
* délai.

Mettre en évidence les différences sans déclarer automatiquement un produit comme « meilleur ».

Ajouter sous chaque colonne :

* `Details ansehen`
* `In den Warenkorb`
* `Entfernen`

## 12. Conseiller de choix

Route visuelle : `/ofenberatung`

Créer un formulaire UI multiétape.

Étapes :

1. Wohnfläche
2. Gebäude und Dämmung
3. Aufstellraum
4. Vorhandener Schornstein
5. Externe Luftzufuhr
6. Gewünschter Brennstoff
7. Stil und Farbe
8. Budget

Créer une barre de progression.

Le résultat affiche :

* une plage de puissance indicative ;
* trois modèles suggérés ;
* les hypothèses utilisées ;
* les points à vérifier ;
* une invitation à demander un conseil professionnel.

Afficher clairement :

`Diese Empfehlung ist eine unverbindliche Orientierung und ersetzt keine Heizlastberechnung oder technische Prüfung.`

## 13. Livraison et installation

Route : `/liefergebiet`

Créer :

* champ de code postal ;
* résultat de disponibilité ;
* tarif estimé ;
* quantité minimale ;
* délai ;
* conditions d’accès ;
* FAQ.

Route : `/montage-und-inbetriebnahme`

Expliquer visuellement les trois options :

1. `Nur Lieferung`
2. `Lieferung mit Montagevermittlung`
3. `Lieferung und Montage`

Afficher ce qui peut être inclus ou exclu :

* transport ;
* mise en place ;
* plaque de sol ;
* raccordement ;
* tuyau ;
* arrivée d’air ;
* contrôle du conduit ;
* réception ;
* travaux supplémentaires.

Créer un formulaire fictif de demande d’installation avec :

* code postal ;
* type de logement ;
* année du bâtiment ;
* conduit existant ;
* emplacement ;
* produit souhaité ;
* possibilité d’ajouter des images ;
* coordonnées ;
* consentement.

Ne pas fournir de tutoriel d’installation autonome.

## 14. Recherche

Créer une recherche plein écran ou un panneau.

Afficher :

* produits récents ;
* recherches populaires ;
* suggestions automatiques ;
* catégories ;
* bois ;
* poêles ;
* accessoires ;
* guides.

Créer les états :

* recherche vide ;
* chargement ;
* aucun résultat ;
* faute de frappe ;
* résultats groupés.

## 15. Panier

Route : `/warenkorb`

Créer un panier visuel avec :

* photo ;
* nom ;
* variante ;
* quantité ;
* prix ;
* prix de base si applicable ;
* suppression ;
* favoris ;
* disponibilité ;
* délai.

Pour un poêle, afficher :

* modèle ;
* couleur ;
* poids ;
* mode de livraison ;
* message sur l’installation non incluse si applicable.

Résumé :

* Zwischensumme
* Versand
* Mehrwertsteuer
* Gesamtsumme

Ajouter :

* champ code postal ;
* code promo purement visuel ;
* bouton `Zur Kasse`;
* moyens de paiement ;
* sécurité ;
* délai estimé.

Afficher des produits complémentaires sans forcer l’ajout.

Créer un mini-panier accessible depuis le header.

## 16. Checkout

Route : `/kasse`

Créer un checkout sans distraction avec un header simplifié.

Étapes :

1. Kontaktdaten
2. Lieferadresse
3. Lieferart
4. Zahlung
5. Prüfen und bestellen

Champs :

* E-Mail-Adresse
* Vorname
* Nachname
* Straße
* Hausnummer
* Adresszusatz
* Postleitzahl
* Ort
* Land
* Telefonnummer
* Hinweise zur Zufahrt

Options de livraison :

* Bordsteinkante
* Verwendungsstelle
* Abholung
* Terminlieferung

Moyens de paiement simulés :

* Kreditkarte
* PayPal
* Vorkasse
* Rechnung

Créer la page finale avec :

* caractéristiques essentielles ;
* quantité ;
* adresse ;
* livraison ;
* paiement ;
* prix total ;
* TVA ;
* liens AGB et Widerruf ;
* checkbox AGB non précochée ;
* checkbox newsletter séparée et non précochée.

Le bouton final doit impérativement être :

`Zahlungspflichtig bestellen`

Créer des états :

* données invalides ;
* code postal non desservi ;
* moyen de paiement indisponible ;
* paiement en cours ;
* paiement échoué ;
* commande réussie.

## 17. Confirmation de commande

Route : `/bestellung/bestaetigt`

Afficher :

* icône de confirmation ;
* `Vielen Dank für Ihre Bestellung`;
* numéro de commande ;
* résumé ;
* adresse ;
* paiement ;
* livraison ;
* étapes suivantes ;
* bouton `Bestellung verfolgen`;
* bouton `Weiter einkaufen`.

Pour un poêle, rappeler :

`Bitte nehmen Sie den Kaminofen erst nach fachgerechter Installation und den erforderlichen Prüfungen in Betrieb.`

## 18. Suivi de commande

Route : `/bestellung/verfolgen`

Créer :

* champ numéro de commande ;
* champ e-mail ou code postal ;
* timeline.

Étapes :

* Bestellung eingegangen
* Zahlung bestätigt
* In Vorbereitung
* Versand geplant
* Unterwegs
* Zugestellt

Ajouter une carte de livraison fictive uniquement si elle améliore l’interface.

## 19. Connexion et compte client

Créer les écrans UI :

* `/konto/anmelden`
* `/konto/registrieren`
* `/konto/passwort-vergessen`
* `/konto`
* `/konto/bestellungen`
* `/konto/adressen`
* `/konto/favoriten`
* `/konto/datenschutz`

Le tableau de bord doit afficher :

* commande récente ;
* statut ;
* favoris ;
* adresses ;
* bouton de nouvelle commande.

Créer également l’état utilisateur invité.

## 20. Pages de contenu

Créer les pages :

### Über uns

* histoire ;
* mission ;
* qualité ;
* partenaires ;
* zones desservies ;
* photographies professionnelles.

### Ratgeber

Grille d’articles avec catégories :

* Brennholz
* Kaminöfen
* Lagerung
* Energie
* Sicherheit

### Article

Créer une mise en page éditoriale lisible avec :

* titre ;
* résumé ;
* image ;
* sommaire ;
* contenu ;
* encadrés ;
* articles associés.

### FAQ

Accordéons regroupés par :

* Bestellung
* Brennholz
* Kaminöfen
* Lieferung
* Zahlung
* Rückgabe
* Montage

### Kontakt

Créer :

* formulaire ;
* coordonnées ;
* horaires ;
* carte facultative ;
* choix du sujet ;
* numéro de commande facultatif.

## 21. Pages légales

Créer uniquement la mise en page UI des pages suivantes avec des textes placeholders structurés :

* Impressum
* Datenschutz
* AGB
* Widerrufsbelehrung
* Widerrufsformular
* Versand und Zahlung
* Barrierefreiheit
* Cookie-Einstellungen

Les pages légales doivent être très lisibles avec :

* largeur de lecture limitée ;
* table des matières ;
* titres hiérarchisés ;
* date de dernière mise à jour ;
* bouton d’impression ;
* aucun effet visuel distrayant.

## 22. Bandeau cookies

Créer un bandeau conforme visuellement avec :

* explication courte ;
* bouton `Alle akzeptieren`;
* bouton `Alle ablehnen`;
* bouton `Einstellungen`;
* même importance visuelle pour accepter et refuser.

Créer aussi une modale détaillée avec catégories :

* Notwendig
* Statistik
* Marketing
* Externe Medien

Les options facultatives sont désactivées par défaut.

## 23. Composants réutilisables

Créer une bibliothèque cohérente de composants :

* Header
* MobileNavigation
* Footer
* AnnouncementBar
* Button
* Input
* Select
* Checkbox
* RadioGroup
* QuantitySelector
* Badge
* EnergyLabel
* ProductCard
* WoodProductCard
* StoveProductCard
* CategoryCard
* PriceDisplay
* BasePrice
* StockIndicator
* DeliveryChecker
* DeliveryResult
* FilterSidebar
* FilterDrawer
* SortMenu
* Breadcrumbs
* ProductGallery
* TechnicalSpecs
* ComparisonBar
* ComparisonTable
* ReviewCard
* ArticleCard
* FAQAccordion
* CartDrawer
* CartItem
* CheckoutStepper
* OrderTimeline
* CookieBanner
* CookieSettingsModal
* Toast
* Modal
* Drawer
* EmptyState
* ErrorState
* Skeleton
* Pagination

## 24. États UI obligatoires

Pour les composants importants, créer :

* état normal ;
* hover ;
* focus ;
* active ;
* disabled ;
* loading ;
* success ;
* warning ;
* error ;
* empty ;
* out of stock ;
* low stock.

Créer également :

* page 404 ;
* page erreur générale ;
* état maintenance ;
* état hors connexion visuel ;
* skeletons de chargement.

## 25. Responsive

Desktop :

* grilles larges ;
* filtres latéraux ;
* navigation complète ;
* tableaux techniques.

Tablette :

* grilles de deux ou trois colonnes ;
* filtres dans un panneau ;
* header simplifié.

Mobile :

* priorité aux informations essentielles ;
* une colonne ;
* filtres dans un drawer ;
* CTA d’achat fixe en bas sur les fiches produit ;
* mini-panier plein écran ;
* tableaux techniques transformés en listes ;
* comparateur horizontal accessible ;
* aucun débordement ;
* aucun texte minuscule.

## 26. Données fictives

Créer au minimum :

* 12 produits de bois ;
* 10 poêles à bois ;
* 8 accessoires ;
* 6 avis ;
* 6 articles ;
* plusieurs catégories ;
* plusieurs variantes ;
* différents états de stock.

Utiliser des noms allemands réalistes, mais ne pas copier les textes, modèles ou visuels d’une marque existante.

Exemples de marques fictives :

* Nordfeuer
* Waldkraft
* Bergen Wärme
* Feuerholm
* Elbstein

Exemples de modèles fictifs :

* Nordlicht 7
* Bergen 5
* Elbstein 8
* Waldruh 6
* Feuerholm Compact

## 27. Exigences de qualité

Le résultat doit ressembler à une vraie boutique allemande prête à être présentée à un client.

Éviter :

* lorem ipsum ;
* textes en anglais ;
* incohérences de prix ;
* cartes toutes identiques ;
* énormes titres vides ;
* abus d’arrondis ;
* animations excessives ;
* illustrations cartoon ;
* esthétique de template générique ;
* dashboards inutiles sur les pages publiques ;
* faux labels de conformité ;
* promesses environnementales non vérifiables.

Utiliser de vrais textes UI allemands dans tous les composants.

Les documents, certifications et étiquettes sont des éléments visuels fictifs clairement structurés. Ne pas inventer de numéros officiels ni prétendre qu’un produit fictif est réellement certifié.

## 28. Résultat attendu

Générer l’UI complète de toutes les pages et composants décrits.

Commencer par :

1. le design system ;
2. le header et le footer ;
3. la page d’accueil ;
4. le catalogue de bois ;
5. le catalogue des poêles ;
6. les deux types de fiches produit ;
7. le comparateur ;
8. le panier ;
9. le checkout ;
10. les pages de service, compte, contenu et légales.

Le rendu final doit être cohérent sur toutes les pages, entièrement responsive et navigable avec des interactions simulées.

Rappel final : créer uniquement l’interface utilisateur et le frontend visuel. Ne créer ni backend, ni base de données, ni API, ni intégration de paiement réelle.
