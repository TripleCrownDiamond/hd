# PRD complet — Boutique Next.js de bois de chauffage et poêles à bois en Allemagne

Version : 1.0  
Date de référence juridique : 27 juillet 2026  
Langue du site : allemand (`de-DE`)  
Marché initial : Allemagne, vente B2C avec possibilité d’ajouter le B2B  

> Important : ce document constitue un cahier des charges produit et une base de travail. Les modèles juridiques contiennent des champs à compléter et doivent être validés par un avocat allemand avant la mise en production. Ils ne remplacent pas un conseil juridique personnalisé.

---

# 1. Résumé du produit

Créer une boutique en ligne allemande moderne permettant aux particuliers de commander des bûches naturelles, des granulés de bois, des briquettes/bois compressé et des poêles à bois (`Kaminöfen/Holzöfen`) avec livraison locale ou régionale. Le site doit rendre simples des éléments normalement complexes : type de combustible, essence, humidité, longueur, diamètre, certification, pouvoir calorifique, taux de cendres, unité vendue, puissance et rendement du poêle, combustible compatible, conformité, quantité, délai, zone desservie, coût de livraison et conditions de déchargement.

Le site sera développé avec Next.js et comportera :

- un catalogue de bois de chauffage ;
- un catalogue de granulés de bois ;
- un catalogue de briquettes et bois compressé ;
- un catalogue de poêles à bois, accessoires et pièces compatibles ;
- des variantes par essence, longueur, séchage et conditionnement ;
- des filtres techniques pour choisir un poêle adapté ;
- un calculateur de livraison par code postal ;
- une demande facultative de conseil ou d’installation par un professionnel qualifié ;
- un panier et un tunnel de commande juridiquement conforme ;
- des paiements sécurisés ;
- un compte client facultatif ;
- un suivi de commande ;
- une administration complète ;
- les pages légales allemandes ;
- une architecture SEO locale ;
- une conformité RGPD, TDDDG, PAngV, BGB/EGBGB, DDG, VerpackG, BFSG et règles applicables au bois.

Nom temporaire du projet : `[SHOP_NAME]`  
Domaine : `[DOMAIN.DE ou DOMAIN.COM]`

---

# 2. Objectifs

## 2.1 Objectifs commerciaux

- Vendre des bûches naturelles, des granulés, des briquettes/bois compressé, des poêles à bois et leurs accessoires aux particuliers en Allemagne.
- Permettre une commande sans échange manuel préalable.
- Afficher le coût final avant la création de la commande.
- Augmenter le panier moyen avec des lots, palettes et accessoires.
- Générer du trafic organique grâce aux pages locales.
- Réduire les questions répétitives sur les dimensions, l’humidité et la livraison.

## 2.2 Objectifs utilisateur

- Savoir exactement quel bois est acheté.
- Comparer clairement les bûches, granulés et briquettes sans présenter ces combustibles comme interchangeables.
- Vérifier que le combustible est expressément autorisé par la notice de l’appareil.
- Comparer les poêles selon leur puissance, rendement, classe énergétique, dimensions, émissions et combustible autorisé.
- Comprendre que la compatibilité avec le logement, le conduit et les règles locales doit être contrôlée par un professionnel compétent avant installation et mise en service.
- Comprendre l’unité de vente.
- Vérifier immédiatement si la livraison est disponible.
- Connaître le prix total, TVA et livraison incluses, avant paiement.
- Choisir une date ou une plage de livraison si le transporteur le permet.
- Recevoir une confirmation et suivre la commande.

## 2.3 Indicateurs de succès

- Taux de conversion catalogue → commande : objectif initial ≥ 2 %.
- Abandon au paiement : inférieur à 35 %.
- Calculs de livraison réussis : ≥ 98 %.
- Core Web Vitals : niveau « Good » au 75e percentile.
- Taux d’erreur de paiement : inférieur à 2 % hors refus bancaire.
- Réponses du support concernant les frais de livraison : baisse de 60 %.
- Pages produit indexables sans duplication.

---

# 3. Périmètre

## 3.1 MVP obligatoire

- Accueil.
- Catalogue et catégories.
- Comparateur de poêles.
- Recherche et filtres.
- Fiche produit.
- Variantes et stock.
- Calculateur de livraison par code postal.
- Panier.
- Tunnel de commande invité.
- Paiement en ligne et option facture/virement si autorisée.
- E-mails transactionnels.
- Suivi simple de commande.
- Administration des produits, commandes, clients, stocks, tarifs et zones.
- Pages de contenu.
- Pages légales.
- Consentement cookies.
- SEO technique.
- Journalisation des actions administratives.

## 3.2 Phase 2

- Compte client.
- Commande récurrente.
- Abonnement saisonnier.
- Créneaux de livraison.
- Programme de fidélité.
- Avis vérifiés.
- Packs `Kaminofen + Ofenrohr + Bodenplatte`, avec contrôle de compatibilité.
- Réservation d’une visite technique.
- Mise en relation avec des installateurs et ramoneurs partenaires.
- Tarifs professionnels.
- Devis B2B.
- Optimisation automatique des tournées.
- Multilingue allemand/anglais/français.

## 3.3 Hors périmètre initial

- Marketplace multi-vendeurs.
- Gestion comptable complète.
- Conseil de dimensionnement thermique juridiquement engageant entièrement automatisé.
- Tutoriel d’installation autonome d’un poêle.
- Flotte logistique avec GPS temps réel.
- Application mobile native.
- Export international automatique.

---

# 4. Utilisateurs et rôles

## 4.1 Visiteur

- Consulte les produits et contenus.
- Vérifie son code postal.
- Ajoute au panier.
- Accepte ou refuse les cookies facultatifs.

## 4.2 Client

- Commande comme invité ou avec un compte.
- Reçoit les documents et notifications.
- Consulte le statut de sa commande.
- Peut exercer ses droits RGPD et son droit de rétractation.

## 4.3 Employé logistique

- Consulte les commandes à préparer.
- Met à jour les étapes de préparation et livraison.
- Ajoute une preuve de livraison.
- Ne voit que les informations nécessaires à la livraison.

## 4.4 Support

- Consulte les commandes et échanges.
- Ajoute des notes internes.
- Déclenche un remboursement selon ses permissions.

## 4.5 Administrateur

- Gère tous les contenus et paramètres.
- Gère les rôles.
- Consulte les journaux.
- Configure les paiements, livraisons, taxes et intégrations.

---

# 5. Catalogue et modèle commercial

## 5.1 Catégories suggérées

- `Kaminholz`
- `Brennholz`
- `Scheitholz`
- `Holzscheite`
- `Buche`
- `Eiche`
- `Birke`
- `Mischholz`
- `Anzündholz`
- `Holzpellets`
- `Pellets Sackware`
- `Pellets Palettenware`
- `Pellets lose Ware` uniquement si la logistique par camion-silo est réellement disponible
- `Holzbriketts`
- `RUF-Briketts`
- `Nestro-Briketts`
- `Pini-Kay-Briketts`
- `Kaminöfen`
- `Specksteinöfen`
- `Dauerbrandöfen` uniquement si les produits correspondent réellement à cette qualification
- `Wasserführende Kaminöfen` en phase ultérieure avec exigences techniques spécifiques
- `Ofenrohre`
- `Funkenschutzplatten`
- `Kaminbesteck`
- `Ersatzteile`
- `Zubehör`

## 5.2 Attributs obligatoires d’un produit bois

- Nom commercial.
- Essence ou mélange exact.
- État : frais, pré-séché, séché à l’air ou séché en chambre.
- Teneur en humidité annoncée et méthode de mesure.
- Longueur nominale des bûches.
- Tolérance de longueur.
- Diamètre ou plage de diamètre, si pertinent.
- Unité de vente exacte.
- Volume ou masse de référence.
- Conditionnement : sac, carton, caisse, palette, vrac.
- Quantité nette.
- Prix total TTC.
- Prix de base lorsque la PAngV l’exige.
- Disponibilité.
- Délai de livraison.
- Zone de livraison.
- Mode de déchargement.
- Provenance du bois.
- Informations de traçabilité.
- Référence fournisseur/lot.
- Photos correspondant au conditionnement réel.
- Consignes de stockage.
- Consignes d’utilisation.

## 5.3 Unités

Ne pas employer une unité ambiguë sans définition. Le site doit distinguer clairement :

- `m³` : mètre cube solide ;
- `Raummeter (Rm)` : volume empilé incluant les vides ;
- `Schüttraummeter (Srm)` : volume versé incluant les vides ;
- kilogramme ou tonne ;
- palette/sac uniquement si la quantité nette est également indiquée.

Chaque page produit doit inclure une explication de l’unité et éviter toute conversion universelle trompeuse entre Rm, Srm et kg. La conversion varie selon l’essence, la longueur, l’empilage et l’humidité.

Pour les granulés et briquettes, afficher :

- poids net par sac/paquet ;
- nombre de sacs/paquets par palette ;
- poids net total de la palette ;
- prix par kilogramme comme prix de base lorsque requis ;
- quantité minimale ;
- consigne éventuelle ;
- poids de l’emballage séparé si pertinent.

Ne jamais confondre kilogrammes nets, poids brut de palette et volume.

## 5.4 Attributs obligatoires des granulés de bois

- Nom commercial.
- Fabricant et conditionneur.
- Type : sac, palette ou vrac.
- Classe de qualité annoncée.
- Certification réellement détenue, par exemple ENplus, avec classe et identifiant vérifiable.
- Référence à la norme applicable, si revendiquée.
- Diamètre nominal.
- Longueur/plage.
- Matière première.
- Humidité.
- Taux de cendres.
- Pouvoir calorifique inférieur.
- Durabilité mécanique.
- Taux de fines.
- Masse volumique apparente.
- Additifs déclarés.
- Poids net par sac.
- Nombre de sacs par palette.
- Poids net total.
- Origine.
- Numéro de lot.
- Conditions de stockage.
- Appareils compatibles.
- Prix TTC.
- Prix de base au kilogramme.
- Livraison.
- Images du vrai emballage.
- Documents/certificats.

Si le produit porte ENplus :

- vérifier l’entreprise et l’identifiant dans la base officielle ;
- reproduire exactement la classe et l’identifiant ;
- respecter les règles d’utilisation de la marque et du logo ;
- ne jamais utiliser le logo pour un produit non certifié ;
- conserver le certificat et sa période de validité.

ENplus concerne la qualité technique et la chaîne de contrôle ; ne pas transformer cette certification en affirmation générale non justifiée sur la durabilité ou la neutralité carbone.

## 5.5 Attributs obligatoires des briquettes et bois compressé

- Nom commercial.
- Forme/type : RUF, Nestro, Pini Kay ou autre.
- Fabricant.
- Matière première et essence/mélange si documenté.
- Produit 100 % bois uniquement si prouvé.
- Liants/additifs.
- Classe ou référence DIN EN ISO 17225-3 si réellement déclarée.
- Humidité.
- Taux de cendres.
- Pouvoir calorifique inférieur.
- Masse volumique.
- Dimensions d’une briquette.
- Poids net par paquet.
- Nombre de paquets par palette.
- Poids net total.
- Origine.
- Lot.
- Combustibles/appareils compatibles selon notice.
- Conditions de stockage.
- Prix TTC.
- Prix de base au kilogramme.
- Livraison.
- Documents qualité.

Le terme `Holzbriketts` doit être réservé aux produits correspondant réellement à cette description. Les briquettes non ligneuses doivent être séparées et ne pas être ajoutées au MVP sans analyse réglementaire spécifique.

## 5.6 Attributs obligatoires d’un poêle à bois

- Marque.
- Fabricant.
- Modèle et numéro de modèle/type.
- GTIN/EAN si disponible.
- Référence interne/SKU.
- Type de poêle.
- Combustibles expressément autorisés.
- Puissance thermique nominale en kW.
- Plage de puissance si documentée par le fabricant.
- Rendement.
- Efficacité énergétique saisonnière.
- Classe d’efficacité énergétique et étiquette applicable.
- Indice d’efficacité énergétique si applicable.
- Diamètre du raccord de fumée.
- Position du raccord : dessus/arrière.
- Tirage requis.
- Arrivée d’air externe : oui/non et diamètre.
- Fonctionnement dépendant ou indépendant de l’air ambiant, uniquement selon certification.
- Dimensions exactes.
- Poids.
- Matériaux et finition.
- Distance minimale aux matériaux combustibles selon la documentation du fabricant.
- Température des fumées.
- Débit massique des fumées.
- Valeurs d’émissions documentées : poussières/particules, CO, OGC et NOx selon les données applicables.
- Conformité Ecodesign.
- Conformité aux exigences de la 1. BImSchV.
- Norme harmonisée et déclaration de performance lorsque applicable.
- Marquage CE et déclaration UE de conformité/performance pertinente.
- Notice d’utilisation et notice d’installation en allemand.
- Fiche produit et étiquette énergétique.
- Identité et coordonnées du fabricant.
- Identité de l’importateur ou de la personne responsable dans l’UE si nécessaire.
- Avertissements et informations de sécurité.
- Disponibilité des pièces détachées.
- Garantie commerciale éventuelle, distincte de la garantie légale.
- Contenu exact de la livraison.
- Indication claire : installation et réception incluses ou non.

Le back-office interdit la publication d’un poêle tant que les documents de conformité obligatoires, les informations de sécurité et l’identité de l’opérateur économique responsable ne sont pas renseignés.

## 5.7 Outil d’aide au choix

L’outil doit seulement orienter le client et ne remplace pas le calcul d’un professionnel. Questions :

- surface approximative ;
- qualité d’isolation ;
- année/type du logement ;
- pièce d’installation ;
- conduit existant ;
- arrivée d’air externe ;
- combustible souhaité ;
- style et budget.

Le résultat affiche une plage indicative, les hypothèses et le message :

`Die endgültige Eignung, Leistung und Anschlussmöglichkeit müssen vor Installation durch einen qualifizierten Fachbetrieb und den zuständigen bevollmächtigten Bezirksschornsteinfeger geprüft werden.`

L’outil ne recommande des pellets ou briquettes que si le modèle d’appareil est conçu et homologué pour ce combustible. Un poêle à bûches ordinaire ne doit jamais être présenté automatiquement comme compatible avec les granulés.

## 5.8 Humidité

Le catalogue doit permettre d’enregistrer :

- valeur cible ;
- valeur maximale garantie ;
- date ou période de contrôle ;
- méthode de mesure ;
- lot contrôlé.

Pour l’utilisation dans les installations relevant de la 1. BImSchV, le produit doit être présenté conformément aux exigences applicables au combustible, notamment la limite d’humidité prévue pour le bois concerné. Ne jamais afficher « ofenfertig » sans spécification mesurable.

## 5.9 Stock

Stock géré par combinaison :

`essence + longueur + humidité/état + conditionnement + dépôt + lot`

Pour les poêles :

`marque + modèle + couleur/finition + dépôt + numéro de série si attribué`

Pour les granulés et briquettes :

`type + marque + classe/qualité + conditionnement + poids net + dépôt + lot + date de réception`

États :

- en stock ;
- stock faible ;
- précommande ;
- indisponible ;
- saisonnier.

Le stock est réservé pendant 15 minutes au paiement. Après expiration, il est libéré.

---

# 6. Architecture des pages

## 6.1 Pages publiques

1. `/` — Startseite
2. `/brennholz` — catalogue
3. `/brennholz/[category]`
4. `/produkt/[slug]`
5. `/liefergebiet`
6. `/lieferung`
7. `/holz-ratgeber`
8. `/holz-ratgeber/[slug]`
9. `/ueber-uns`
10. `/kontakt`
11. `/faq`
12. `/warenkorb`
13. `/kasse`
14. `/bestellung/bestaetigt`
15. `/bestellung/verfolgen`
16. `/konto/*`
17. `/kaminoefen` — catalogue des poêles
18. `/kaminoefen/[category]`
19. `/kaminofen/[slug]`
20. `/kaminoefen-vergleichen`
21. `/ofenberatung`
22. `/montage-und-inbetriebnahme`
23. `/holzpellets`
24. `/holzpellets/[slug]`
25. `/holzbriketts`
26. `/holzbriketts/[slug]`
27. `/brennstoffe-vergleichen`

## 6.2 Pages légales

1. `/impressum`
2. `/datenschutz`
3. `/agb`
4. `/widerrufsbelehrung`
5. `/widerrufsformular`
6. `/versand-und-zahlung`
7. `/barrierefreiheit`
8. `/cookie-einstellungen`
9. `/entsorgung-verpackung` si nécessaire

## 6.3 Pages SEO locales

Exemples :

- `/brennholz-berlin`
- `/brennholz-hamburg`
- `/brennholz-muenchen`

Une page locale ne doit exister que si la zone est réellement desservie. Elle doit contenir du contenu utile et unique : produits disponibles, prix ou logique tarifaire, délai, modalités de livraison et FAQ locale. Interdire la génération de centaines de pages quasi identiques.

---

# 7. Exigences UX et design

## 7.1 Direction visuelle

- Style naturel, premium et rassurant.
- Palette : brun foncé, beige, vert forêt, blanc cassé.
- Photos réelles du bois, conditionnement et véhicule de livraison.
- Typographie très lisible.
- Éviter les artifices visuels qui ralentissent le site.

## 7.2 En-tête

- Logo.
- Catalogue.
- Zone de livraison.
- Guide.
- Contact.
- Recherche.
- Compte.
- Panier.

## 7.3 Hero

Titre proposé :

`Brennholz und Kaminöfen bequem online bestellen`

Sous-titre :

`Hochwertiges Kaminholz, geprüfte Kaminöfen, transparente Produktdaten und zuverlässige Lieferung in Ihrer Region.`

CTA :

- `Brennholz bestellen`
- `Holzpellets entdecken`
- `Holzbriketts entdecken`
- `Kaminöfen entdecken`
- `Liefergebiet prüfen`

## 7.4 Fiche produit

Au-dessus de la ligne de flottaison :

- titre ;
- galerie ;
- essence ;
- humidité ;
- longueur ;
- unité/quantité ;
- prix TTC ;
- prix de base ;
- mention TVA et frais de livraison ;
- disponibilité ;
- délai ;
- sélecteur de variante ;
- quantité ;
- champ code postal ;
- coût ou lien de calcul de livraison ;
- bouton `In den Warenkorb`.

Sous la ligne :

- description complète ;
- caractéristiques ;
- définition de l’unité ;
- origine et traçabilité ;
- livraison/déchargement ;
- stockage et utilisation ;
- FAQ ;
- produits complémentaires.

## 7.5 Fiche produit d’un poêle

Au-dessus de la ligne de flottaison :

- titre, marque et modèle ;
- galerie ;
- prix TTC ;
- livraison et délai ;
- classe énergétique avec étiquette visible conformément aux règles applicables ;
- puissance nominale ;
- rendement ;
- combustible ;
- diamètre/position du raccord ;
- dimensions et poids ;
- variantes ;
- disponibilité ;
- bouton `In den Warenkorb` ;
- lien `Technische Daten` ;
- lien vers notice, fiche produit et documents autorisés ;
- avertissement indiquant qu’une vérification du conduit et une réception professionnelle sont nécessaires.

Sous la ligne :

- tableau technique complet ;
- données d’émissions ;
- conformité et documents ;
- distances de sécurité ;
- contenu du colis ;
- livraison ;
- installation/réception ;
- garantie légale et garantie commerciale ;
- fabricant, importateur ou responsable UE ;
- avertissements GPSR ;
- pièces et accessoires compatibles ;
- FAQ.

Ne jamais suggérer qu’un modèle convient à un logement uniquement à partir de sa surface. La fiche doit distinguer l’achat du produit, l’installation, le raccordement et la réception.

## 7.6 Catalogue de granulés

Filtres :

- classe/certification ;
- diamètre ;
- conditionnement ;
- poids du sac ;
- nombre de sacs ;
- poids de la palette ;
- taux de cendres ;
- humidité ;
- pouvoir calorifique ;
- origine ;
- prix ;
- prix au kilogramme ;
- disponibilité ;
- type de livraison.

Chaque carte affiche :

- photo du vrai sac ;
- marque ;
- classe et identifiant uniquement s’ils sont vérifiés ;
- diamètre ;
- poids par sac ;
- nombre de sacs ;
- poids total ;
- pouvoir calorifique ;
- taux de cendres ;
- prix TTC ;
- prix au kilogramme ;
- délai ;
- stock.

## 7.7 Fiche produit de granulés

Afficher :

- galerie ;
- fabricant ;
- classe de qualité ;
- certification et identifiant vérifiable ;
- diamètre ;
- humidité ;
- cendres ;
- pouvoir calorifique ;
- fines ;
- durabilité ;
- poids par sac ;
- nombre de sacs ;
- poids total ;
- lot ;
- origine ;
- stockage ;
- compatibilité ;
- prix TTC ;
- prix de base ;
- livraison ;
- documents.

Ajouter l’avertissement :

`Bitte verwenden Sie nur Brennstoffe, die laut Herstellerangaben für Ihre Feuerungsanlage zugelassen sind.`

## 7.8 Catalogue et fiche de briquettes

Filtres :

- forme : RUF, Nestro, Pini Kay ;
- matière première ;
- poids du paquet ;
- nombre de paquets ;
- poids palette ;
- humidité ;
- taux de cendres ;
- pouvoir calorifique ;
- origine ;
- prix au kilogramme ;
- disponibilité.

La fiche affiche :

- type/forme ;
- composition ;
- additifs ;
- norme/classe si déclarée ;
- humidité ;
- cendres ;
- pouvoir calorifique ;
- dimensions ;
- poids net ;
- conditionnement ;
- lot ;
- stockage ;
- compatibilité ;
- prix TTC ;
- prix de base ;
- livraison.

## 7.9 Comparateur de combustibles

Créer une page pédagogique qui compare sans fausse équivalence :

- bûches naturelles ;
- granulés ;
- briquettes.

Comparer :

- appareil nécessaire ;
- alimentation manuelle/automatique ;
- unité de vente ;
- stockage ;
- humidité ;
- densité ;
- manipulation ;
- cendres ;
- données qualité ;
- format de livraison.

Ne pas déclarer un combustible universellement meilleur. La compatibilité dépend de l’appareil et de sa notice.

## 7.10 Accessibilité

Le site doit viser WCAG 2.2 AA :

- navigation intégrale au clavier ;
- focus visible ;
- contraste suffisant ;
- structure de titres correcte ;
- labels explicites ;
- messages d’erreur reliés aux champs ;
- textes alternatifs ;
- zoom jusqu’à 200 % sans perte ;
- pas d’information transmise uniquement par couleur ;
- respect de `prefers-reduced-motion` ;
- annonces accessibles pour panier et erreurs ;
- paiement et authentification accessibles ;
- déclaration d’accessibilité si le BFSG s’applique.

---

# 8. Livraison

## 8.1 Vérification de zone

Le client saisit son `Postleitzahl`. Le système retourne :

- livrable/non livrable ;
- tarif ;
- quantité minimale ;
- délai estimé ;
- mode de déchargement ;
- éventuelle zone spéciale.

## 8.2 Modèle tarifaire

Supporter :

- tarif fixe par zone ;
- tarif par distance ;
- tarif par palette ;
- tarif par poids/volume ;
- livraison gratuite à partir d’un seuil ;
- surcharge îles/zones difficiles ;
- retrait dépôt.

Pour les poêles, supporter :

- livraison par colis ou palette ;
- livraison au bord du trottoir ;
- livraison au lieu d’utilisation si réellement proposée ;
- supplément pour étage/accès difficile ;
- service de prise de rendez-vous ;
- assurance transport ;
- reprise d’emballage si applicable.

Pour granulés et briquettes :

- sac individuel ;
- colis ;
- demi-palette ;
- palette complète ;
- plusieurs palettes ;
- vrac par camion-silo uniquement si réellement proposé ;
- frais calculés par poids, palette et zone ;
- contraintes d’accès ;
- prise de rendez-vous ;
- seuil minimal ;
- hayon/transpalette ;
- impossibilité clairement signalée de déplacer une palette sur un sol non adapté.

Pour les granulés en vrac, prévoir une demande spécifique :

- code postal ;
- quantité ;
- type de silo ;
- capacité ;
- longueur de tuyau nécessaire ;
- contraintes d’accès ;
- date souhaitée ;
- fournisseur régional.

## 8.3 Informations obligatoires avant paiement

- prix de livraison exact ou méthode de calcul claire ;
- délai ou plage de livraison ;
- restrictions géographiques ;
- conditions d’accès ;
- lieu de déchargement ;
- responsabilité du client pour l’accessibilité ;
- absence ou présence de rangement du bois ;
- procédure en cas d’absence ;
- frais d’une seconde présentation, si applicables et valides.

## 8.4 Données d’adresse

- prénom/nom ou entreprise ;
- rue et numéro ;
- complément ;
- code postal ;
- ville ;
- pays ;
- téléphone pour le transporteur ;
- note d’accès ;
- consentement séparé si une utilisation facultative du numéro est envisagée.

## 8.5 Statuts logistiques

`pending → paid → confirmed → preparing → ready_for_dispatch → dispatched → delivered`

États alternatifs :

`payment_failed`, `on_hold`, `cancelled`, `refunded`, `delivery_failed`, `returned`.

## 8.6 Installation des poêles

Trois offres doivent être clairement distinguées :

1. `Nur Lieferung` : vente et livraison uniquement.
2. `Lieferung + Montagevermittlung` : mise en relation avec un partenaire, avec identification claire du cocontractant.
3. `Lieferung + Montage durch uns` : contrat incluant une prestation d’installation réalisée par l’entreprise ou un sous-traitant sous sa responsabilité.

Le site ne doit jamais laisser penser qu’une livraison simple comprend :

- le contrôle du conduit ;
- le percement ;
- le tubage ;
- le raccordement ;
- la protection du sol ;
- les travaux d’air extérieur ;
- la réception par le ramoneur compétent ;
- l’autorisation de mise en service.

Avant une offre d’installation ferme, collecter les informations nécessaires et prévoir une visite technique lorsque la situation ne peut pas être évaluée à distance. Le client doit être informé de contacter le `bevollmächtigter Bezirksschornsteinfeger` suffisamment tôt. L’installation et la première mise en service doivent respecter la notice, le droit de la construction du Land, les règles de combustion locales et les exigences du conduit.

---

# 9. Panier et tunnel de commande

## 9.1 Panier

Afficher :

- produit et variante ;
- quantité/unité ;
- prix unitaire ;
- prix de base ;
- sous-total ;
- TVA ;
- livraison ;
- total ;
- délai ;
- code postal ;
- contraintes de livraison.

Le total doit être recalculé côté serveur. Aucun montant envoyé par le navigateur ne doit être considéré comme fiable.

## 9.2 Checkout

Étapes :

1. Coordonnées.
2. Adresse.
3. Livraison.
4. Paiement.
5. Vérification finale.

La page finale, immédiatement avant la commande, doit récapituler clairement les caractéristiques essentielles, la quantité, le prix total, les frais, la durée et les conditions pertinentes.

Le bouton final doit porter une formulation allemande non ambiguë, par exemple :

`Zahlungspflichtig bestellen`

Ne pas utiliser uniquement `Bestellen`, `Weiter`, `Registrieren` ou une formule ambiguë.

Les cases AGB et Widerruf ne doivent pas être précochées. L’acceptation des AGB peut être demandée avec liens accessibles et version enregistrée. La newsletter doit avoir une case distincte, facultative et non précochée.

## 9.3 Confirmation

Après commande :

- numéro ;
- résumé ;
- adresse ;
- paiement ;
- livraison ;
- liens vers AGB, Widerrufsbelehrung et formulaire ;
- bouton `Rechnung als PDF herunterladen` ;
- moyen de contacter le vendeur.

Les conditions contractuelles applicables doivent être envoyées sur un support durable, normalement par e-mail/PDF.

Le PDF doit être disponible seulement après la création réussie de la commande. Si la facture finale n’est pas encore juridiquement/comptablement émise, afficher d’abord une `Bestellbestätigung` ou `Proformarechnung` clairement identifiée, puis générer la `Rechnung` au moment configuré.

---

# 10. Paiement

## 10.1 Moyens suggérés

- Stripe : carte, Apple Pay, Google Pay, SEPA et moyens activés.
- Autres prestataires de paiement ajoutables via une architecture d’adaptateurs.
- PayPal si activé.
- Virement bancaire manuel.
- Paiement manuel enregistré par un administrateur.
- `Kauf auf Rechnung` uniquement avec gestion du risque adaptée.

## 10.2 Règles

- Utiliser une page hébergée ou des composants certifiés du prestataire.
- Ne jamais stocker les numéros complets de carte.
- Ne jamais stocker le CVV/CVC, la piste magnétique, le PIN ou des données d’authentification sensibles.
- Vérifier les webhooks.
- Utiliser une clé d’idempotence.
- Ne confirmer une commande payée qu’après événement serveur valide.
- Journaliser les remboursements.
- Masquer les secrets dans les logs.
- Séparer strictement le statut de commande et le statut de paiement.
- Ne jamais considérer un retour navigateur comme preuve définitive de paiement.
- Seul un webhook signé ou une confirmation serveur vérifiée peut marquer un paiement prestataire comme réussi.

## 10.3 Configuration multi-prestataires

Créer une interface interne `PaymentProvider` permettant d’ajouter ou remplacer un prestataire sans réécrire le checkout :

```text
createCheckoutSession()
createPayment()
confirmPayment()
getPaymentStatus()
savePaymentMethod()
chargeSavedPaymentMethod()
refundPayment()
verifyWebhook()
normalizeWebhookEvent()
```

Chaque moyen de paiement est configurable depuis le dashboard :

- activé/désactivé ;
- mode test/live ;
- titre affiché ;
- description client ;
- ordre d’affichage ;
- pays/devise autorisés ;
- montant minimum/maximum ;
- surcharge uniquement si juridiquement autorisée ;
- clé publique ;
- secrets stockés uniquement dans les variables serveur ;
- webhook secret ;
- moyens secondaires autorisés ;
- capture automatique ou manuelle ;
- paiement immédiat ou différé.

Le dashboard ne doit jamais afficher les clés secrètes déjà enregistrées. Il peut seulement indiquer `Configuré`, `Non configuré`, permettre leur remplacement et lancer un test de connexion.

## 10.4 Virement bancaire

Le virement bancaire manuel doit être entièrement gérable :

- nom du titulaire ;
- banque ;
- IBAN ;
- BIC ;
- référence de paiement générée ;
- délai de paiement ;
- instructions allemandes ;
- statut `pending_bank_transfer` ;
- date attendue ;
- justificatif facultatif ;
- validation manuelle par un administrateur ;
- nom de l’administrateur ayant validé ;
- date de rapprochement ;
- montant reçu ;
- écart éventuel ;
- annulation automatique ou manuelle après expiration.

Les informations bancaires sont configurables dans le dashboard. L’IBAN public de réception peut apparaître dans la confirmation de commande et l’e-mail. Les coordonnées bancaires privées du client ne doivent pas être collectées inutilement.

## 10.5 Paiement manuel

Un administrateur autorisé peut enregistrer un paiement reçu hors plateforme :

- virement ;
- espèces ;
- terminal physique ;
- chèque uniquement si accepté ;
- autre moyen documenté.

L’action exige :

- montant ;
- devise ;
- date ;
- référence ;
- moyen ;
- justificatif facultatif ;
- note ;
- identité de l’opérateur ;
- journal d’audit.

Un paiement manuel ne doit jamais simuler un événement Stripe ou modifier l’historique existant. Il crée une transaction séparée de type `manual`.

## 10.6 Enregistrement d’un moyen de paiement pour une utilisation ultérieure

Il est interdit d’enregistrer manuellement dans Supabase ou dans le dashboard :

- le numéro complet de carte ;
- le CVV/CVC ;
- une photographie de la carte ;
- les données brutes saisies par le client.

Pour permettre un nouveau prélèvement :

1. collecter la carte directement avec Stripe Checkout ou Stripe Elements ;
2. créer un `Customer` chez Stripe ;
3. utiliser un `SetupIntent` ou la fonctionnalité de sauvegarde du checkout ;
4. obtenir le consentement explicite du client ;
5. préciser la finalité, le montant ou son mode de calcul, la fréquence et les conditions ;
6. enregistrer uniquement les identifiants tokenisés ;
7. déclencher le futur paiement via le prestataire ;
8. gérer SCA/3D Secure et ramener le client dans un parcours d’authentification lorsque la banque l’exige.

Données pouvant être conservées dans Supabase :

- `provider`;
- `provider_customer_id`;
- `provider_payment_method_id`;
- marque de carte ;
- quatre derniers chiffres ;
- mois/année d’expiration ;
- nom descriptif ;
- date et version du consentement ;
- usage autorisé : `on_session` ou `off_session`;
- statut ;
- date de révocation.

Le bouton administratif doit être nommé `Zahlung erneut anfordern` ou `Gespeicherte Zahlungsmethode belasten`, jamais `Kartendaten verwenden`.

Avant un prélèvement hors session :

- vérifier le mandat/consentement ;
- afficher le montant et le motif ;
- exiger une confirmation administrateur ;
- appliquer les permissions renforcées ;
- utiliser une clé d’idempotence ;
- journaliser la demande ;
- notifier le client ;
- gérer `requires_action`, refus, expiration et authentification supplémentaire ;
- ne jamais relancer automatiquement sans limite.

## 10.7 Remboursement

- total ;
- partiel ;
- frais de livraison selon la situation légale ;
- motif ;
- opérateur ;
- date ;
- identifiant du prestataire.

---

# 11. Administration

## 11.1 Tableau de bord

- chiffre d’affaires ;
- commandes ;
- chiffre d’affaires payé/en attente/remboursé ;
- panier moyen ;
- produits les plus vendus ;
- stocks faibles ;
- échecs de paiement ;
- livraisons du jour ;
- retours/rétractations.
- conversations ouvertes ;
- demandes de transfert humain ;
- e-mails échoués ;
- notifications Telegram échouées ;
- quotas Resend ;
- commandes nécessitant une action.

Navigation du dashboard :

- Übersicht
- Produkte
- Kategorien
- Lagerbestand
- Bestellungen
- Zahlungen
- Banküberweisungen
- Kunden
- Lieferungen
- Chat und Support
- KI-Assistent
- Blog
- Seiten
- Rechtstexte
- Medien
- E-Mails
- Telegram
- Einstellungen
- Benutzer und Rollen
- Audit-Protokoll

## 11.2 Produits

- CRUD produit/variante ;
- brouillon/publié/archivé ;
- lot et origine ;
- humidité ;
- prix TTC ;
- TVA ;
- prix de base ;
- médias ;
- SEO ;
- stock par dépôt.
- duplication ;
- import/export CSV ;
- publication planifiée ;
- ventes croisées ;
- produits liés ;
- accessoires compatibles ;
- documents techniques ;
- données fabricant/importateur/responsable UE ;
- alertes de conformité ;
- historique des modifications ;
- corbeille et restauration.

## 11.3 Commandes

- recherche et filtres ;
- détail ;
- création manuelle ;
- modification contrôlée avant traitement ;
- snapshots des produits ;
- changement de statut ;
- facture ;
- avoir ;
- remboursement ;
- paiements et tentatives ;
- validation d’un virement ;
- nouvelle demande de paiement tokenisée ;
- informations de livraison ;
- timeline client ;
- e-mails et notifications ;
- conversation support liée ;
- notes internes ;
- historique immuable ;
- export CSV.

Workflow :

```text
draft
→ pending_payment
→ paid
→ confirmed
→ preparing
→ ready_for_dispatch
→ dispatched
→ delivered
```

États alternatifs :

```text
payment_failed
payment_action_required
pending_bank_transfer
on_hold
cancelled
partially_refunded
refunded
delivery_failed
returned
```

Chaque changement important crée un événement `order_event` contenant :

- ancien statut ;
- nouveau statut ;
- acteur ;
- origine : client, admin, webhook ou système ;
- date ;
- message public facultatif ;
- note interne facultative ;
- métadonnées non sensibles.

## 11.4 Zones et tarifs

- groupes de codes postaux ;
- seuils ;
- suppléments ;
- quantités min/max ;
- calendrier ;
- exceptions.

## 11.5 CMS

- pages ;
- FAQ ;
- articles ;
- blocs de page d’accueil ;
- menus ;
- métadonnées ;
- redirections.

## 11.6 Pages légales

Créer un éditeur de pages légales distinct du CMS marketing :

- Impressum ;
- Datenschutz ;
- AGB ;
- Widerrufsbelehrung ;
- Muster-Widerrufsformular ;
- Versand und Zahlung ;
- Barrierefreiheit ;
- Cookie-Einstellungen.

Fonctions :

- brouillon ;
- aperçu ;
- publication ;
- date d’entrée en vigueur ;
- numéro de version ;
- auteur ;
- historique immuable ;
- comparaison de versions ;
- restauration ;
- export PDF/HTML ;
- variables structurées d’entreprise ;
- publication simultanée des liens footer ;
- association de la version AGB/Widerruf à chaque commande ;
- interdiction de supprimer une version utilisée par une commande.

Toute modification d’un texte légal doit être auditée. Le système ne doit pas présenter les textes générés par IA comme validés juridiquement.

## 11.7 Blog

Gestion complète des articles :

- titre ;
- slug ;
- extrait ;
- contenu riche ;
- image principale ;
- galerie ;
- auteur ;
- catégorie ;
- tags ;
- statut brouillon/révision/planifié/publié/archivé ;
- date de publication ;
- SEO title ;
- meta description ;
- canonical ;
- Open Graph ;
- table des matières ;
- articles liés ;
- aperçu desktop/mobile ;
- révisions ;
- redirections lors du changement de slug.

## 11.8 Paiements

Écrans :

- liste des transactions ;
- paiements en attente ;
- échecs ;
- remboursements ;
- virements à rapprocher ;
- moyens enregistrés tokenisés ;
- configuration des prestataires ;
- webhooks reçus ;
- événements non traités ;
- rapprochement ;
- export comptable.

Permissions spécifiques :

- `payments.read`;
- `payments.capture`;
- `payments.refund`;
- `payments.manual_record`;
- `payments.charge_saved_method`;
- `payments.configure_provider`.

Les actions sensibles nécessitent une réauthentification/MFA et une confirmation explicite.

## 11.9 Utilisateurs, rôles et audit

Rôles :

- super-admin ;
- administrateur ;
- gestionnaire produits ;
- gestionnaire commandes ;
- support ;
- logistique ;
- éditeur ;
- lecture seule.

Toutes les mutations sensibles sont enregistrées :

- connexion ;
- modification produit ;
- changement de prix ;
- changement de stock ;
- publication légale ;
- modification commande ;
- paiement ;
- remboursement ;
- export ;
- accès aux données personnelles ;
- changement de configuration ;
- prise en charge d’une conversation.

## 11.10 Notifications Telegram

Créer une intégration gratuite avec un bot Telegram via l’API officielle.

Événements configurables :

- nouvelle commande ;
- paiement réussi ;
- paiement échoué ;
- virement en attente ;
- stock faible ;
- demande d’installation ;
- nouvelle conversation transférée ;
- client demandant un humain ;
- erreur critique ;
- e-mail échoué.

Configuration serveur :

- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_ADMIN_CHAT_ID`;
- activation/désactivation ;
- événements autorisés ;
- bouton de test ;
- journal des envois.

Le token n’est jamais exposé au navigateur. Les messages ne doivent contenir que les données nécessaires :

```text
Neue Bestellung #HK-2026-00124
Betrag: 649,00 €
Zahlung: Banküberweisung ausstehend
Liefergebiet: 10115 Berlin
Admin: [Bestellung öffnen]
```

Ne pas envoyer dans Telegram :

- numéro complet de carte ;
- token de paiement ;
- documents d’identité ;
- adresse complète si non indispensable ;
- secrets ;
- contenu confidentiel de conversation.

Une erreur Telegram ne doit jamais annuler une commande. Enregistrer la notification dans une file avec tentatives limitées.

## 11.11 Assistant IA et chat client

Créer un widget de chat allemand présent sur les pages publiques.

Fonctions :

- répondre aux questions sur les produits ;
- expliquer les unités de bois ;
- comparer des produits sans inventer de données ;
- répondre sur livraison, paiement, retours et suivi ;
- rechercher dans les pages, FAQ, produits et documents approuvés ;
- demander le numéro de commande uniquement lorsque nécessaire ;
- transmettre à un administrateur ;
- créer un ticket ;
- afficher les horaires du support ;
- reprendre une conversation existante.

L’assistant doit clairement indiquer qu’il s’agit d’une IA :

`Ich bin der digitale Assistent von [SHOP_NAME]. Ich kann bei Produkten, Lieferung und Bestellungen helfen.`

Il ne doit pas :

- inventer prix, stock, délai ou certification ;
- fournir un diagnostic technique définitif sur l’installation d’un poêle ;
- demander des données de carte ;
- demander un mot de passe ;
- valider un remboursement ;
- promettre un geste commercial ;
- modifier une commande sans confirmation et permission ;
- remplacer l’avis d’un installateur ou ramoneur.

Sources autorisées :

- catalogue publié ;
- FAQ ;
- pages de livraison ;
- pages légales publiées ;
- articles approuvés ;
- statut de la commande du client authentifié ou vérifié.

Transfert humain déclenché si :

- le client le demande ;
- confiance de réponse insuffisante ;
- litige ;
- remboursement ;
- installation complexe ;
- réclamation sécurité ;
- paiement bloqué ;
- question juridique ;
- trois réponses non résolues.

Lors du transfert :

- créer ou mettre à jour une conversation ;
- produire un résumé factuel ;
- conserver l’historique visible ;
- notifier Telegram ;
- placer la conversation dans la file support ;
- afficher le délai estimé ;
- permettre à l’agent humain de répondre depuis le dashboard.

Statuts :

```text
ai_active
waiting_for_customer
human_requested
queued
assigned
human_active
resolved
closed
```

Le fournisseur IA doit être configurable. Les clés restent côté serveur. Prévoir une limite de messages, un contrôle de coût, un filtre contre l’exfiltration du prompt et une journalisation minimisée.

## 11.12 Suivi de commande

Le client peut suivre sa commande :

- depuis son compte ;
- via un lien signé reçu par e-mail ;
- avec numéro de commande et donnée de vérification.

La page affiche :

- numéro ;
- date ;
- produits ;
- paiement ;
- adresse partiellement masquée ;
- livraison ;
- statut ;
- timeline ;
- derniers événements publics ;
- transporteur ;
- numéro de suivi ;
- créneau ;
- bouton de contact ;
- demande de transfert humain.

Ne jamais exposer les notes internes, événements techniques, IDs prestataire ou données sensibles.

Les statuts publics allemands :

- `Bestellung eingegangen`
- `Zahlung ausstehend`
- `Zahlung bestätigt`
- `Bestellung bestätigt`
- `Wird vorbereitet`
- `Versandbereit`
- `Unterwegs`
- `Zugestellt`
- `Storniert`
- `Rückerstattet`

Chaque changement public peut déclencher :

1. enregistrement dans Supabase ;
2. e-mail Resend au client ;
3. notification administrative facultative ;
4. message Telegram selon configuration.

## 11.13 Factures PDF

Créer un module complet de facturation permettant de générer, conserver et télécharger une facture PDF liée à chaque commande.

Points d’accès :

- page de confirmation ;
- page de suivi via lien signé ;
- compte client ;
- détail d’une commande dans le dashboard ;
- e-mail Resend ;
- export administratif.

Documents possibles :

- `Bestellbestätigung` : confirmation de commande ;
- `Proformarechnung` : document informatif ne remplaçant pas une facture fiscale ;
- `Rechnung` : facture ;
- `Stornorechnung` ou correction selon le processus comptable validé ;
- `Gutschrift`/avoir lorsque juridiquement approprié.

Déclenchement configurable :

- immédiatement à la commande ;
- après confirmation du paiement ;
- après validation manuelle d’un virement ;
- après expédition ;
- manuellement par un administrateur autorisé.

Comportement recommandé :

- carte payée : générer la facture après confirmation du webhook ;
- virement : générer une facture `Offen` avec échéance ou une proforma selon le processus comptable choisi ;
- paiement manuel : générer après validation ;
- paiement échoué : ne pas générer de facture indiquée comme payée ;
- remboursement : ne jamais modifier silencieusement le PDF initial ; créer le document correctif requis.

### Contenu minimal à gérer

Le modèle doit prendre en charge les mentions obligatoires applicables, notamment :

- nom et adresse complète du vendeur ;
- forme juridique ;
- numéro fiscal ou USt-IdNr. selon le cas ;
- nom et adresse du client lorsque requis ;
- numéro de facture unique et séquentiel ;
- date d’émission ;
- date de livraison/prestation ou information correspondante ;
- numéro et date de commande ;
- quantité ;
- désignation précise des produits ;
- prix unitaires ;
- remises ;
- frais de livraison ;
- montant net par taux ;
- taux de TVA ;
- montant de TVA ;
- montant brut ;
- devise ;
- moyen de paiement ;
- statut `Offen`, `Bezahlt`, `Teilbezahlt`, `Storniert` ou `Erstattet` ;
- échéance pour un virement ;
- IBAN/BIC et référence si paiement en attente ;
- informations légales particulières selon le régime fiscal.

Les règles exactes doivent être validées par le conseiller fiscal, particulièrement pour :

- petite entreprise/Kleinunternehmer ;
- ventes B2B ;
- ventes transfrontalières ;
- OSS ;
- exonérations ;
- livraison et installation ;
- avoirs/corrections ;
- obligations de facturation électronique structurée.

### Numérotation

- séquence configurable, exemple `RE-2026-000001` ;
- numéro attribué côté serveur ;
- unicité garantie par la base ;
- aucune réutilisation ;
- aucun changement après émission ;
- journal des annulations ;
- séquence distincte par type uniquement si validée ;
- verrouillage concurrentiel pour éviter les doublons.

### Stockage et sécurité

- PDF généré côté serveur ;
- fichier stocké dans un bucket Supabase Storage privé ;
- chemin non devinable ;
- accès par URL signée courte ;
- contrôle d’autorisation avant chaque téléchargement ;
- hash SHA-256 conservé pour vérifier l’intégrité ;
- snapshot JSON immuable des données ayant servi à produire le PDF ;
- conservation conforme aux obligations fiscales ;
- aucune URL publique permanente ;
- les administrateurs ne peuvent pas remplacer un PDF émis ;
- toute nouvelle version crée un document distinct et audité.

### Présentation du PDF

- format A4 ;
- langue allemande ;
- logo ;
- coordonnées ;
- numéro de facture ;
- tableau lisible ;
- récapitulatif net/TVA/brut ;
- informations de paiement ;
- pagination ;
- police intégrée ;
- rendu imprimable ;
- taille optimisée ;
- texte sélectionnable ;
- document accessible autant que possible.

Nom de fichier :

```text
Rechnung_[RECHNUNGSNUMMER]_[BESTELLNUMMER].pdf
```

### E-mail Resend

La confirmation envoyée au client contient :

- la facture en pièce jointe si sa taille est raisonnable ; ou
- un lien sécurisé et temporaire vers le téléchargement ;
- le numéro de commande ;
- le numéro de facture ;
- le statut de paiement.

L’e-mail administrateur contient un lien vers la commande et la facture dans le dashboard. Utiliser une clé d’idempotence distincte :

```text
invoice-customer/[invoice_id]
invoice-admin/[invoice_id]
```

Une erreur Resend ne doit pas annuler la facture. Elle crée une tâche de nouvelle tentative.

---

# 12. Architecture technique Next.js

## 12.1 Stack recommandée

- Next.js 15+ avec App Router, version LTS/supportée au moment du développement.
- TypeScript strict.
- React Server Components par défaut.
- Tailwind CSS.
- Supabase Free comme backend principal : PostgreSQL, Auth, Storage et Realtime uniquement si nécessaire.
- Supabase SSR avec cookies sécurisés pour les sessions Next.js.
- SQL et client Supabase typé ; Prisma/Drizzle uniquement si cela apporte une valeur réelle sans dupliquer inutilement la couche de données.
- Supabase Auth pour les comptes clients et administrateurs.
- Stripe/PayPal côté serveur.
- Resend Free pour les e-mails transactionnels et le SMTP personnalisé de Supabase Auth.
- Supabase Storage pour les médias et documents, dans les limites du plan gratuit.
- Sentry pour les erreurs.
- Plausible ou Matomo en mode respectueux de la vie privée ; consentement selon configuration.
- Vercel pour les previews et le déploiement initial de développement.
- Domaine enregistré chez GoDaddy et DNS gérés depuis GoDaddy.

## 12.2 Structure suggérée

```text
src/
  app/
    (shop)/
    (legal)/
    (account)/
    admin/
    api/
  components/
  features/
    catalog/
    cart/
    checkout/
    delivery/
    orders/
    payments/
  lib/
    auth/
    db/
    email/
    payments/
    security/
    validation/
  server/
  styles/
prisma/
public/
tests/
```

## 12.3 Entités principales

- `User`
- `Address`
- `Product`
- `ProductVariant`
- `ProductComplianceDocument`
- `EconomicOperator`
- `InstallationRequest`
- `InstallerPartner`
- `ProductRecall`
- `Category`
- `Media`
- `Warehouse`
- `InventoryLot`
- `DeliveryZone`
- `DeliveryRate`
- `Cart`
- `CartItem`
- `Order`
- `OrderItem`
- `Payment`
- `PaymentProviderConfig`
- `SavedPaymentMethod`
- `PaymentAttempt`
- `BankTransfer`
- `Refund`
- `Invoice`
- `InvoiceDocument`
- `InvoiceSequence`
- `Shipment`
- `OrderEvent`
- `LegalDocumentVersion`
- `Page`
- `BlogPost`
- `BlogCategory`
- `ConsentRecord`
- `Conversation`
- `ConversationMessage`
- `SupportTicket`
- `AiKnowledgeDocument`
- `NotificationJob`
- `EmailEvent`
- `TelegramEvent`
- `AuditLog`
- `ContactRequest`
- `NewsletterSubscription`

## 12.4 Contraintes de données

- Prix enregistrés en centimes entiers.
- Devise `EUR`.
- Taux de TVA enregistré au niveau de la ligne de commande.
- Les lignes de commande sont des snapshots : nom, caractéristiques, quantité, prix, taxe et unité ne changent plus si le produit est modifié.
- Chaque facture conserve son propre snapshot comptable immuable, distinct des données courantes du client, des produits et de la société.
- Le numéro de facture est unique, séquentiel selon la série configurée et attribué exclusivement côté serveur dans une transaction protégée contre la concurrence.
- Une facture émise ne peut pas être supprimée ou réécrite silencieusement : toute correction passe par une annulation, une facture rectificative ou un avoir traçable.
- Les lignes de poêle conservent également un snapshot des informations de sécurité, du fabricant, du modèle, de l’étiquette énergétique et de l’opérateur économique.
- Une version horodatée des AGB et de la Widerrufsbelehrung est liée à la commande.
- Les journaux ne doivent pas contenir de données de carte ni secrets.

## 12.5 API

- `GET /api/products`
- `GET /api/products/[slug]`
- `POST /api/delivery/quote`
- `POST /api/cart`
- `POST /api/checkout`
- `POST /api/payments/session`
- `POST /api/webhooks/stripe`
- `POST /api/webhooks/paypal`
- `GET /api/orders/[token]`
- routes admin protégées.

Validation avec Zod. Limitation de débit sur login, checkout, contact et calculateur. Protection CSRF pour les mutations reposant sur cookies.

## 12.6 Architecture Supabase

Supabase doit fournir :

- PostgreSQL pour les produits, variantes, stocks, commandes, clients, consentements, documents et journaux ;
- Supabase Auth pour inscription, connexion, récupération de mot de passe et sessions ;
- Supabase Storage pour les images produits, notices, étiquettes et documents ;
- Row Level Security sur toutes les tables exposées ;
- migrations SQL versionnées dans le dépôt ;
- types TypeScript générés depuis le schéma ;
- service serveur sécurisé pour les opérations privilégiées ;
- environnement local via Supabase CLI lorsque possible.

Principes impératifs :

- activer RLS avant d’exposer une table ;
- refuser par défaut puis autoriser explicitement ;
- ne jamais exposer la clé secrète ou `service_role` au navigateur ;
- utiliser uniquement la clé publique/publishable côté client ;
- recalculer prix, taxes, livraison et stock dans un contexte serveur autorisé ;
- limiter les fichiers par type, taille et bucket ;
- séparer les buckets publics des documents privés ;
- protéger les factures, commandes et documents clients avec des URLs signées ;
- créer des sauvegardes/exportations régulières, car les garanties du plan gratuit sont limitées ;
- surveiller l’inactivité : un projet Free peut être mis en pause.

Tables minimales :

```text
profiles
addresses
categories
products
product_variants
product_media
product_documents
economic_operators
warehouses
inventory_lots
delivery_zones
delivery_rates
carts
cart_items
orders
order_items
payments
payment_provider_configs
saved_payment_methods
payment_attempts
bank_transfers
refunds
invoices
invoice_documents
invoice_sequences
shipments
order_events
installation_requests
legal_document_versions
pages
blog_posts
blog_categories
consent_records
email_events
telegram_events
notification_jobs
conversations
conversation_messages
support_tickets
ai_knowledge_documents
audit_logs
```

## 12.7 E-mails avec Resend

Tous les e-mails applicatifs doivent être envoyés par Resend depuis une route serveur Next.js ou une fonction serveur sécurisée. L’application doit démarrer sur le plan gratuit sans abonnement payant.

À la date de référence du document, le compte Resend Free prévoit notamment une limite de 100 e-mails transactionnels par jour et 3 000 par mois. Les limites peuvent changer et doivent être relues avant le lancement.

E-mails pris en charge :

- confirmation d’inscription ;
- vérification d’adresse ;
- récupération de mot de passe ;
- confirmation de commande ;
- paiement confirmé ou échoué ;
- commande en préparation ;
- date de livraison ;
- expédition ;
- livraison ;
- annulation ;
- remboursement ;
- demande d’installation ;
- notification interne d’une nouvelle commande ;
- formulaire de contact.

À la création d’une commande valide :

1. enregistrer la commande et ses lignes dans Supabase dans une transaction logique cohérente ;
2. enregistrer la version des textes légaux acceptés ;
3. créer les événements de commande ;
4. déclencher le paiement ou enregistrer le virement en attente ;
5. envoyer un e-mail de confirmation au client ;
6. envoyer un e-mail de notification à l’administrateur ;
7. envoyer une notification au bot Telegram ;
8. enregistrer séparément le résultat de chaque notification.

L’échec d’un e-mail ou de Telegram ne doit pas supprimer ni dupliquer la commande. Une file `notification_jobs` permet des tentatives limitées et idempotentes.

Exigences :

- utiliser React Email ou des templates HTML simples et accessibles ;
- fournir une version texte ;
- envoyer depuis `bestellung@[DOMAIN]` ou `mail@[DOMAIN]` ;
- utiliser `reply-to: service@[DOMAIN]` ;
- ne jamais envoyer depuis une adresse gratuite personnelle ;
- enregistrer l’identifiant Resend, le type, le destinataire masqué, le statut et l’erreur éventuelle ;
- ne jamais journaliser le contenu sensible complet ;
- utiliser une clé d’idempotence pour éviter les doublons ;
- prévoir des tentatives limitées avec backoff ;
- ne pas bloquer la validation de commande si un e-mail échoue après l’enregistrement correct de la commande ;
- afficher dans l’administration les e-mails échoués et permettre une nouvelle tentative ;
- surveiller les quotas journaliers et mensuels ;
- désactiver les envois marketing automatiques dans le MVP ;
- appliquer le double opt-in à la newsletter.

Pour Supabase Auth, configurer Resend comme SMTP personnalisé afin d’éviter de dépendre du fournisseur intégré très limité. Les URLs de redirection doivent être autorisées pour la production et les previews nécessaires.

## 12.8 Domaine GoDaddy et DNS

Le domaine est acheté chez GoDaddy. Aucun hébergement ou service e-mail GoDaddy payant n’est requis pour cette architecture.

Configuration :

1. Ajouter le domaine dans le projet Vercel.
2. Copier exactement les enregistrements DNS demandés par Vercel.
3. Les créer dans la zone DNS GoDaddy.
4. Configurer le domaine racine et `www`.
5. Choisir un domaine canonique et rediriger l’autre en 301.
6. Attendre la propagation DNS et vérifier le certificat HTTPS.
7. Ajouter le domaine ou un sous-domaine d’envoi dans Resend.
8. Copier dans GoDaddy les enregistrements TXT/CNAME/MX fournis par Resend.
9. Configurer SPF, DKIM et DMARC sans créer plusieurs enregistrements SPF concurrents.
10. Vérifier le domaine dans Resend avant tout envoi public.

Sous-domaines recommandés :

- `[DOMAIN]` et `www.[DOMAIN]` pour le site ;
- `send.[DOMAIN]` ou `mail.[DOMAIN]` pour l’envoi Resend ;
- `service@[DOMAIN]` comme adresse de réponse si une vraie boîte de réception existe.

Attention : Resend assure l’envoi transactionnel, mais ne remplace pas nécessairement une boîte mail complète capable de recevoir et gérer les réponses. Au lancement, configurer une adresse de réception ou un transfert vérifié pour `service@[DOMAIN]`.

---

# 13. Sécurité et protection des données

## 13.1 Mesures

- HTTPS uniquement.
- Cookies `Secure`, `HttpOnly`, `SameSite`.
- HSTS.
- CSP.
- Permissions Policy.
- `X-Content-Type-Options: nosniff`.
- Contrôle d’accès par rôle.
- MFA pour administrateurs.
- Hash de mot de passe robuste.
- Rate limiting.
- Validation serveur.
- Requêtes paramétrées/ORM.
- Sauvegardes chiffrées.
- Rotation des secrets.
- Journal d’audit.
- Analyse des dépendances.
- Procédure d’incident.

## 13.2 Minimisation

Ne collecter que les données nécessaires à la commande, au paiement, à la livraison, au support et aux obligations légales.

## 13.3 Conservation suggérée

Les durées exactes doivent être confirmées avec le conseil fiscal/juridique :

- commandes, factures et pièces fiscales : durée légale applicable ;
- comptes inactifs : suppression/anonymisation selon politique définie ;
- paniers abandonnés : courte durée ;
- tickets support : selon finalité et prescription ;
- logs de sécurité : durée limitée et justifiée ;
- newsletter : jusqu’au retrait du consentement, avec preuve du double opt-in.

## 13.4 Cookies

Avant consentement, n’activer que les technologies strictement nécessaires. Les catégories facultatives :

- statistiques ;
- marketing ;
- médias externes ;
- personnalisation.

Le bouton `Ablehnen` doit être aussi accessible que `Akzeptieren`. Permettre le retrait à tout moment via `Cookie-Einstellungen`. Enregistrer la version du bandeau, le choix, l’horodatage et un identifiant pseudonyme.

---

# 14. Exigences légales et opérationnelles avant lancement

## 14.1 Entreprise

- Immatriculer l’activité dans le pays d’établissement.
- Vérifier les obligations allemandes liées à l’établissement, la TVA, l’importation, le stockage et la vente à distance.
- Obtenir le numéro fiscal et, le cas échéant, l’USt-IdNr.
- Vérifier le guichet OSS pour les ventes B2C transfrontalières dans l’UE.
- Avoir un compte professionnel et une facturation conforme.
- Souscrire les assurances utiles.

Une entreprise non allemande peut en principe vendre à des clients allemands, mais cela ne supprime pas les obligations allemandes et européennes applicables au marché ciblé. La situation fiscale et l’existence éventuelle d’un établissement stable doivent être validées par un professionnel.

## 14.2 Bois et combustible

- Acheter uniquement auprès de fournisseurs traçables.
- Conserver factures, lots, essence, origine et documents de légalité.
- Définir honnêtement l’unité vendue.
- Contrôler l’humidité.
- Fournir les instructions de stockage.
- Vérifier la conformité à la 1. BImSchV pour la destination annoncée.
- Ne pas vendre du bois traité, peint ou contaminé comme bois de chauffage domestique.
- Vérifier les règles phytosanitaires et d’importation si le bois vient d’un pays tiers.

## 14.3 EUDR

Le règlement européen sur les produits sans déforestation couvre le bois et certains produits dérivés. Il faut déterminer le rôle exact de l’entreprise : opérateur, opérateur en aval ou négociant, ainsi que sa taille et les codes douaniers des produits.

À la date du présent document, l’application générale est prévue à partir du 30 décembre 2026 et certaines micro/petites entreprises bénéficient d’une échéance au 30 juin 2027 selon les conditions du règlement modifié. Avant lancement ou importation, faire confirmer :

- l’inclusion du produit ;
- la catégorie de l’entreprise ;
- les obligations de diligence ;
- la déclaration de diligence raisonnable ou référence à conserver ;
- la géolocalisation et la traçabilité nécessaires ;
- l’évaluation du risque ;
- les obligations documentaires.

Le back-office doit dès maintenant prévoir : pays d’origine, fournisseur, espèce, lot, coordonnées/parcelles lorsque requises, référence de déclaration et documents.

## 14.4 VerpackG/LUCID

Tout vendeur qui met des marchandises emballées sur le marché allemand doit examiner ses obligations d’emballage. Pour les emballages d’expédition généralement remis aux consommateurs :

- inscription au registre LUCID ;
- contrat de participation à un système ;
- déclaration des quantités au système et à LUCID ;
- conservation des justificatifs.

L’inscription peut concerner aussi une entreprise étrangère. Ne pas expédier avant régularisation.

## 14.5 Prix

- Afficher les prix finaux TTC aux consommateurs.
- Indiquer que les frais de livraison s’ajoutent, avec lien directement accessible.
- Afficher le prix de base lorsqu’il est requis.
- Utiliser l’unité de référence légale adaptée : notamment kilogramme ou mètre cube selon la présentation.
- Ne pas cacher les suppléments.
- Pour une réduction de prix, gérer correctement le prix antérieur légalement pertinent.

## 14.6 Droit de la consommation

- Informations précontractuelles complètes.
- Confirmation sur support durable.
- Droit de rétractation et formulaire type.
- Bouton final conforme.
- Délais et restrictions de livraison.
- Garantie légale.
- Procédure de réclamation.
- Ne pas inventer une exception au droit de rétractation parce que le produit est lourd ou coûteux à retourner.
- Informer à l’avance du coût de retour lorsqu’il ne peut raisonnablement être renvoyé par courrier.

## 14.7 DDG et Impressum

L’Impressum doit être facilement identifiable, directement accessible et disponible en permanence. Il doit refléter la vraie forme juridique et les données réelles.

## 14.8 BFSG

Les services de commerce électronique B2C sont couverts par le BFSG depuis le 28 juin 2025. Les microentreprises fournissant des services peuvent être exemptées si elles remplissent les seuils légaux, mais l’exemption doit être vérifiée. Le produit vendu ici, du bois de chauffage, n’est pas pour autant l’un des produits techniques spécialement listés par le BFSG.

Même en cas d’exemption, appliquer WCAG 2.2 AA constitue la cible produit recommandée. Si le BFSG s’applique, publier les informations d’accessibilité exigées et rendre accessible tout le parcours contractuel.

## 14.9 Ancienne plateforme européenne de règlement en ligne

Ne pas copier les anciens modèles mentionnant la plateforme européenne ODR comme si elle fonctionnait encore. Elle a été supprimée. Vérifier en revanche les obligations d’information liées à la participation ou non à une procédure de règlement devant une `Verbraucherschlichtungsstelle`.

## 14.10 Conformité des poêles à bois

Avant de référencer un poêle, obtenir et contrôler auprès du fabricant ou fournisseur :

- identité exacte du fabricant ;
- modèle/type traçable ;
- marquage CE lorsque requis ;
- déclaration de performance et/ou déclaration UE de conformité pertinente ;
- documentation technique commerciale cohérente ;
- preuve de conformité aux exigences Ecodesign applicables aux appareils de chauffage décentralisés à combustible solide ;
- preuve de conformité aux valeurs applicables de la 1. BImSchV ;
- notice allemande d’installation, utilisation, entretien et sécurité ;
- fiche produit ;
- classe et étiquette énergétique lorsqu’elles sont requises ;
- rapports/certificats de type nécessaires ;
- informations d’émissions et rendement ;
- identité de l’importateur et de la personne responsable dans l’UE si le fabricant est hors UE ;
- système de traçabilité par modèle, lot ou numéro de série.

La vente d’un poêle conforme ne garantit pas qu’il peut être installé dans n’importe quel bâtiment. Les règles du Land, le conduit, l’alimentation en air, les appareils de ventilation, les distances et les prescriptions du ramoneur doivent être examinés séparément.

## 14.11 Ecodesign et étiquetage énergétique

Les appareils de chauffage décentralisés à combustible solide d’une puissance nominale allant jusqu’à 50 kW entrent généralement dans le champ du règlement Ecodesign (UE) 2015/1185, sous réserve de ses exclusions. Les exigences sont applicables depuis le 1er janvier 2022.

Pour chaque modèle couvert, le site doit :

- afficher les informations techniques obligatoires ;
- ne pas publier de valeur non issue des données du fabricant ;
- rendre les documents accessibles ;
- conserver la version du document associée au produit ;
- afficher l’étiquette énergétique et la fiche produit dans la présentation en ligne lorsque les règles d’étiquetage l’exigent ;
- s’assurer que toute publicité ou tout matériel technique comportant une information énergétique respecte les obligations applicables ;
- vérifier l’enregistrement EPREL par la partie qui y est légalement tenue lorsque le produit est soumis à cette obligation.

## 14.12 GPSR et sécurité produit

La réglementation européenne générale sur la sécurité des produits s’applique depuis le 13 décembre 2024 et complète les règles sectorielles pour les risques non entièrement couverts.

Dans chaque offre en ligne d’un poêle ou accessoire concerné, afficher de manière claire et facilement accessible :

- nom, marque et identification du produit ;
- image permettant son identification ;
- fabricant et adresse postale/électronique ;
- si le fabricant est hors UE, personne responsable dans l’UE avec adresse postale et électronique ;
- avertissements et informations de sécurité dans une langue compréhensible pour le marché allemand ;
- autres informations de traçabilité exigées.

Le système doit supporter :

- signalement d’incident ;
- blocage immédiat d’un produit ;
- recherche de toutes les commandes d’un modèle/lot ;
- information directe des clients concernés ;
- enregistrement d’un rappel ;
- réparation, remplacement, remboursement ou autre remède requis ;
- conservation de la preuve des actions.

## 14.13 Importation et responsabilité

Si l’entreprise importe des poêles d’un pays hors UE, elle peut devenir importateur avec des obligations renforcées. Avant l’importation :

- contrôler le dossier de conformité ;
- vérifier la personne responsable dans l’UE ;
- apposer les informations exigées sans masquer celles du fabricant ;
- vérifier les notices allemandes ;
- maintenir la traçabilité ;
- ne pas commercialiser un produit présentant une non-conformité ;
- définir un processus avec les autorités de surveillance.

Ne pas utiliser une marque propre ou modifier substantiellement un poêle sans analyse juridique : l’entreprise pourrait être considérée comme fabricant.

## 14.14 Granulés, briquettes et bûches

Avant publication d’un combustible, vérifier :

- qu’il figure parmi les combustibles autorisés par les règles applicables et par la notice de l’appareil ciblé ;
- sa classification correcte ;
- les données du fabricant ;
- la quantité nette ;
- le conditionnement ;
- le prix de base ;
- les documents qualité ;
- les affirmations de certification ;
- le lot et la traçabilité ;
- les règles d’emballage ;
- les conditions de stockage ;
- les restrictions de livraison.

Références de classification à contrôler selon le produit :

- granulés : DIN EN ISO 17225-2 ;
- briquettes de bois : DIN EN ISO 17225-3 ;
- bûches/stückholz : ISO/DIN EN ISO 17225-5 dans sa version applicable ;
- exigences allemandes de combustible : § 3 de la 1. BImSchV.

Une certification ENplus ou DINplus ne doit être affichée que si le produit et l’entreprise concernés sont réellement certifiés. Conserver :

- certificat ;
- identifiant ;
- classe ;
- titulaire ;
- date d’expiration ;
- produit/conditionnement couvert ;
- preuve de contrôle.

Affirmations interdites sans preuve :

- `CO₂-neutral` ;
- `100 % nachhaltig` ;
- `schadstofffrei` ;
- `aschefrei` ;
- `für jeden Ofen geeignet` ;
- `zertifiziert` sans préciser le système et l’identifiant.

La compatibilité doit être formulée ainsi :

`Nur in dafür zugelassenen Feuerungsanlagen und gemäß Herstelleranleitung verwenden.`

Le stockage doit signaler :

- conserver au sec ;
- protéger l’emballage ;
- éviter le contact avec l’eau ;
- ne pas utiliser un produit détérioré contrairement aux instructions ;
- respecter les consignes du fabricant et de l’installation.

---

# 15. Modèles de pages légales en allemand

Remplacer tous les champs `[ENTRE CROCHETS]`. Supprimer les variantes non applicables uniquement après validation.

## 15.1 Impressum

```text
Impressum

Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)

[VOLLSTÄNDIGER UNTERNEHMENSNAME]
[RECHTSFORM]
[STRASSE UND HAUSNUMMER]
[PLZ ORT]
[LAND]

Vertreten durch:
[VOR- UND NACHNAME DER VERTRETUNGSBERECHTIGTEN PERSON]

Kontakt:
Telefon: [TELEFONNUMMER]
E-Mail: [E-MAIL-ADRESSE]

Registereintrag:
Eingetragen im [HANDELSREGISTER/UNTERNEHMENSREGISTER].
Registergericht: [GERICHT/BEHÖRDE]
Registernummer: [REGISTERNUMMER]

Umsatzsteuer:
Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
[UST-IDNR.]

[FALLS EINSCHLÄGIG:
Wirtschafts-Identifikationsnummer:
[W-IDNR.]]

Verantwortlich für journalistisch-redaktionelle Inhalte:
[NAME]
[ANSCHRIFT]

Verbraucherstreitbeilegung:
[VARIANTE NACH RECHTLICHER PRÜFUNG EINFÜGEN]

Wir sind [nicht] bereit und [nicht] verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
```

## 15.2 AGB

```text
Allgemeine Geschäftsbedingungen

1. Geltungsbereich

Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die Verbraucher oder Unternehmer über den Online-Shop [DOMAIN] mit

[UNTERNEHMENSNAME, RECHTSFORM, ANSCHRIFT]

– nachfolgend „Verkäufer“ – abschließen.

Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können. Unternehmer ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss des Vertrags in Ausübung ihrer gewerblichen oder selbstständigen beruflichen Tätigkeit handelt.

2. Vertragsschluss

Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Abgabe einer Bestellung dar.

Der Kunde kann Produkte auswählen und in den Warenkorb legen. Vor Abgabe der Bestellung kann der Kunde seine Eingaben prüfen und berichtigen. Durch Anklicken der Schaltfläche „Zahlungspflichtig bestellen“ gibt der Kunde ein verbindliches Angebot zum Abschluss eines Kaufvertrags über die im Warenkorb enthaltenen Waren ab.

Der Verkäufer bestätigt den Eingang der Bestellung unverzüglich per E-Mail. Der Vertrag kommt zustande, wenn [EXAKTEN ANNAHMEZEITPUNKT PASSEND ZUM ZAHLUNGSABLAUF EINFÜGEN].

Der Vertragstext wird [BESCHREIBEN, OB UND WIE] gespeichert. Die Bestelldaten und diese AGB werden dem Kunden auf einem dauerhaften Datenträger zur Verfügung gestellt. Vertragssprache ist Deutsch.

3. Produkte, Maße und Mengenangaben

Bei Brennholz handelt es sich um ein Naturprodukt. Farb-, Struktur- und Formabweichungen sind naturbedingt. Die wesentlichen Eigenschaften, insbesondere Holzart, Scheitlänge, Feuchtigkeitsangabe, Lieferform und Verkaufseinheit, ergeben sich aus der jeweiligen Produktbeschreibung.

Die verwendeten Maßeinheiten werden auf der Produktseite erläutert. Raummeter, Schüttraummeter, Festmeter und Gewicht sind nicht ohne Weiteres gleichzusetzen. Angegebene Umrechnungswerte sind nur verbindlich, wenn sie ausdrücklich als garantierte Beschaffenheit bezeichnet werden.

Gesetzliche Rechte des Kunden bei Mängeln bleiben unberührt.

4. Kaminöfen und technische Produkte

Die technischen Eigenschaften eines Kaminofens ergeben sich aus der jeweiligen Produktbeschreibung und den Unterlagen des Herstellers. Hierzu gehören insbesondere Nennwärmeleistung, zugelassene Brennstoffe, Wirkungsgrad, Anschlussmaße, Abmessungen, Gewicht, Sicherheitsabstände und Emissionswerte.

Vor dem Kauf und der Installation muss geprüft werden, ob das Gerät für den vorgesehenen Aufstellort, den vorhandenen Schornstein, die Verbrennungsluftversorgung und die örtlichen Vorschriften geeignet ist. Allgemeine Auswahlhilfen im Online-Shop ersetzen keine individuelle Prüfung durch einen qualifizierten Fachbetrieb und den zuständigen bevollmächtigten Bezirksschornsteinfeger.

[VARIANTE WÄHLEN:
Der Kaufpreis umfasst ausschließlich das in der Produktbeschreibung genannte Gerät und Zubehör. Montage, Anschluss, Schornsteinprüfung und Abnahme sind nicht enthalten.

ODER:
Ist eine Montageleistung ausdrücklich Bestandteil der Bestellung, ergeben sich deren Umfang, Voraussetzungen, Vergütung und Abnahme aus der Leistungsbeschreibung und Auftragsbestätigung.]

Der Kunde darf den Kaminofen erst in Betrieb nehmen, wenn die gesetzlichen, behördlichen und technischen Voraussetzungen erfüllt und die erforderlichen Prüfungen bzw. Abnahmen erfolgt sind.

5. Preise und Zahlungsbedingungen

Alle gegenüber Verbrauchern angegebenen Preise sind Gesamtpreise in Euro und enthalten die gesetzliche Umsatzsteuer. Zusätzlich anfallende Lieferkosten werden vor Abgabe der Bestellung deutlich angezeigt.

Die verfügbaren Zahlungsarten und deren Bedingungen werden im Bestellprozess angezeigt.

6. Lieferung und Liefergebiet

Die Lieferung erfolgt ausschließlich in die auf der Seite „Versand und Lieferung“ angegebenen Gebiete, sofern nichts anderes vereinbart wurde.

Die voraussichtliche Lieferzeit wird beim Produkt und im Bestellprozess angegeben. Bei vereinbarten Lieferzeitfenstern handelt es sich um [VERBINDLICHE TERMINE/UNVERBINDLICHE ZEITFENSTER – PRÜFEN].

Der Kunde hat dafür zu sorgen, dass die Lieferadresse mit dem vereinbarten Lieferfahrzeug sicher und rechtlich zulässig erreichbar ist. Besondere Zufahrtsbeschränkungen, Gewichtsbeschränkungen, enge Straßen oder andere Hindernisse sind dem Verkäufer vor Vertragsschluss mitzuteilen.

Die Lieferung erfolgt [BIS BORDSTEINKANTE/FREI VERWENDUNGSSTELLE/ANDERE LEISTUNG GENAU BESCHREIBEN]. Das Stapeln oder Einlagern des Brennholzes ist [NICHT] Bestandteil der Leistung, sofern es nicht ausdrücklich vereinbart wurde.

Bei Kaminöfen und anderen schweren Produkten ist der genaue Lieferumfang in der Produkt- und Versandbeschreibung angegeben. Eine Lieferung bis zur Bordsteinkante umfasst nicht den Transport in das Gebäude, die Aufstellung, die Montage oder den Anschluss.

Regelungen zu zusätzlichen Kosten bei vom Kunden zu vertretender erfolgloser Anlieferung gelten nur im gesetzlich zulässigen Umfang und wenn der Kunde vor Vertragsschluss darüber informiert wurde.

7. Eigentumsvorbehalt

Bis zur vollständigen Bezahlung bleibt die Ware Eigentum des Verkäufers.

8. Widerrufsrecht

Verbrauchern steht grundsätzlich das gesetzliche Widerrufsrecht zu. Einzelheiten ergeben sich aus der Widerrufsbelehrung.

9. Mängelhaftung

Es gelten die gesetzlichen Mängelhaftungsrechte.

Der Kunde wird gebeten, offensichtliche Transportschäden möglichst beim Zusteller zu dokumentieren und dem Verkäufer mitzuteilen. Die Unterlassung dieser Mitteilung hat keine Auswirkungen auf die gesetzlichen Rechte des Verbrauchers.

10. Haftung

Der Verkäufer haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei schuldhafter Verletzung von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften.

Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Wesentliche Vertragspflichten sind Pflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen darf.

Im Übrigen ist die Haftung bei leichter Fahrlässigkeit ausgeschlossen, soweit gesetzlich zulässig.

11. Anwendbares Recht

Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bei Verbrauchern gilt diese Rechtswahl nur insoweit, als dadurch nicht der Schutz zwingender Bestimmungen des Staates des gewöhnlichen Aufenthalts des Verbrauchers entzogen wird.

12. Streitbeilegung

[RECHTLICH GEPRÜFTE INFORMATION ZUR VERBRAUCHERSCHLICHTUNG EINFÜGEN.]
```

## 15.3 Widerrufsbelehrung

```text
Widerrufsbelehrung

Widerrufsrecht

Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.

Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns

[UNTERNEHMENSNAME]
[ANSCHRIFT]
[E-MAIL]
[TELEFON – OPTIONAL]

mittels einer eindeutigen Erklärung, zum Beispiel eines mit der Post versandten Briefs oder einer E-Mail, über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.

Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.

Folgen des Widerrufs

Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten, mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene günstigste Standardlieferung gewählt haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.

Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.

Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.

Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an

[RÜCKSENDEADRESSE]

zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.

[RÜCKSENDEKOSTEN-VARIANTE RECHTLICH PRÜFEN:
Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.

Falls die Waren aufgrund ihrer Beschaffenheit nicht normal mit der Post zurückgesandt werden können:
Die unmittelbaren Kosten der Rücksendung werden auf höchstens etwa [BETRAG] EUR geschätzt.]

Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.
```

## 15.4 Muster-Widerrufsformular

```text
Muster-Widerrufsformular

Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.

An:
[UNTERNEHMENSNAME]
[ANSCHRIFT]
[E-MAIL]

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren:

__________________________________________________

Bestellt am (*) / erhalten am (*):

__________________________________________________

Name des/der Verbraucher(s):

__________________________________________________

Anschrift des/der Verbraucher(s):

__________________________________________________

Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):

__________________________________________________

Datum:

__________________________________________________

(*) Unzutreffendes streichen.
```

## 15.5 Versand und Zahlung

```text
Versand und Zahlung

1. Liefergebiet

Wir liefern derzeit in folgende Gebiete:
[POSTLEITZAHLEN/REGIONEN]

Ob eine Lieferung an Ihre Adresse möglich ist, können Sie über unsere Postleitzahlprüfung feststellen.

2. Lieferkosten

Die Lieferkosten werden anhand von [ZONE/ENTFERNUNG/MENGE/GEWICHT] berechnet und vor Abgabe der Bestellung im Warenkorb und an der Kasse angezeigt.

[TARIFTABELLE ODER BERECHNUNGSLOGIK]

3. Lieferzeit

Die voraussichtliche Lieferzeit beträgt [X–Y WERKTAGE], sofern beim Produkt nichts anderes angegeben ist.

4. Art der Anlieferung

Die Lieferung erfolgt [GENAUE BESCHREIBUNG: Z. B. FREI BORDSTEINKANTE] mit [FAHRZEUGTYP]. Für die Anfahrt wird eine Zufahrtsbreite von mindestens [X] Metern und eine ausreichende Tragfähigkeit benötigt.

Das Vertragen, Aufschichten oder Einlagern ist [NICHT] im Lieferpreis enthalten.

5. Terminabstimmung

[BESCHREIBEN: TELEFON/E-MAIL, VORLAUF, ZEITFENSTER]

6. Abholung

[FALLS ANGEBOTEN: ADRESSE, ZEITEN, VORAUSSETZUNGEN]

7. Zahlungsarten

Wir bieten folgende Zahlungsarten an:

- [KREDITKARTE]
- [PAYPAL]
- [SEPA/VORKASSE]
- [RECHNUNG]

Die tatsächlich verfügbaren Zahlungsarten werden im Bestellprozess angezeigt.
```

## 15.6 Datenschutzerklärung — structure à personnaliser

```text
Datenschutzerklärung

1. Verantwortlicher

Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:

[UNTERNEHMENSNAME]
[ANSCHRIFT]
[E-MAIL]
[TELEFON]

[FALLS VORHANDEN: KONTAKTDATEN DES DATENSCHUTZBEAUFTRAGTEN]

2. Hosting und Bereitstellung der Website

Wir verarbeiten technisch erforderliche Verbindungs- und Protokolldaten, um die Website sicher und zuverlässig bereitzustellen. Hierzu können insbesondere IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer, Browserinformationen und Statuscodes gehören.

Dienstleister: [HOSTER]
Serverstandort: [LAND/REGION]
Rechtsgrundlage: [ART. 6 ABS. 1 BUCHST. B/F DSGVO – PRÜFEN]
Speicherdauer: [DAUER]
Auftragsverarbeitungsvertrag: [JA/NEIN]

3. Bestellungen und Vertragsabwicklung

Wir verarbeiten Stamm-, Kontakt-, Adress-, Bestell-, Zahlungs- und Lieferdaten, soweit dies zur Anbahnung, Durchführung und Abwicklung des Vertrags erforderlich ist.

Rechtsgrundlage: Art. 6 Abs. 1 Buchst. b DSGVO.

Soweit gesetzliche Aufbewahrungspflichten bestehen, erfolgt die weitere Speicherung auf Grundlage von Art. 6 Abs. 1 Buchst. c DSGVO.

4. Kundenkonto

[DATEN, ZWECK, RECHTSGRUNDLAGE, LÖSCHUNG BESCHREIBEN]

5. Zahlungsdienstleister

Je nach ausgewählter Zahlungsart werden die für die Zahlung erforderlichen Daten an folgende Anbieter übermittelt:

[STRIPE MIT VOLLSTÄNDIGER FIRMENBEZEICHNUNG, ANSCHRIFT, DATENSCHUTZLINK]
[PAYPAL ...]

Informationen zu Drittlandübermittlungen und Garantien:
[ANGABEN]

6. Versand- und Logistikdienstleister

Zur Lieferung übermitteln wir die erforderlichen Adress- und Kontaktdaten an:

[DIENSTLEISTER]

Die Telefonnummer oder E-Mail-Adresse wird nur übermittelt, soweit dies für die Lieferabwicklung erforderlich ist oder eine passende Einwilligung vorliegt.

7. Kontakt

Bei einer Kontaktaufnahme verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Rechtsgrundlage ist je nach Inhalt Art. 6 Abs. 1 Buchst. b oder f DSGVO.

8. Newsletter

Der Newsletter wird nur nach wirksamer Einwilligung und grundsätzlich über ein Double-Opt-in-Verfahren versendet.

Anbieter: [ANBIETER]
Rechtsgrundlage: Art. 6 Abs. 1 Buchst. a DSGVO.
Widerruf: jederzeit über den Abmeldelink oder eine Nachricht an uns.

9. Cookies und ähnliche Technologien

Wir verwenden technisch erforderliche Technologien, soweit dies für den ausdrücklich gewünschten digitalen Dienst unbedingt erforderlich ist. Optionale Technologien werden erst nach Ihrer Einwilligung aktiviert.

Einwilligungsmanagement:
[ANBIETER/SELBST GEHOSTET]

Sie können Ihre Auswahl jederzeit über „Cookie-Einstellungen“ ändern.

10. Reichweitenmessung

[NUR TATSÄCHLICH VERWENDETE TOOLS BESCHREIBEN: ANBIETER, DATEN, ZWECK, RECHTSGRUNDLAGE, SPEICHERDAUER, WIDERRUF, DRITTLANDTRANSFER]

11. Externe Medien und Schriftarten

[GOOGLE MAPS/YOUTUBE/FONTS ETC. NUR WENN VERWENDET; LOKALES FONT-HOSTING BEVORZUGEN]

12. Empfänger und Auftragsverarbeiter

[KATEGORIEN/ANBIETER]

13. Drittlandübermittlungen

[ANGEMESSENHEITSBESCHLUSS, EU-STANDARDVERTRAGSKLAUSELN UND ZUSÄTZLICHE MASSNAHMEN SOWEIT EINSCHLÄGIG]

14. Speicherdauer

Wir speichern personenbezogene Daten nur so lange, wie dies für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Konkrete Fristen ergeben sich aus den jeweiligen Abschnitten.

15. Ihre Rechte

Sie haben nach Maßgabe der gesetzlichen Voraussetzungen das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen können jederzeit mit Wirkung für die Zukunft widerrufen werden.

Sie haben außerdem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.

16. Pflicht zur Bereitstellung

Die für Bestellung, Zahlung und Lieferung erforderlichen Angaben müssen bereitgestellt werden, da andernfalls der Vertrag nicht durchgeführt werden kann. Freiwillige Angaben sind entsprechend gekennzeichnet.

17. Automatisierte Entscheidungen

[ANGEBEN, OB AUTOMATISIERTE ENTSCHEIDUNGEN/SCORING STATTFINDEN.]

18. Aktualisierung

Stand: [DATUM]
```

## 15.7 Déclaration d’accessibilité

```text
Informationen zur Barrierefreiheit

[UNTERNEHMENSNAME] ist bestrebt, den Online-Shop [DOMAIN] barrierefrei zugänglich zu machen.

Beschreibung der Dienstleistung:
Über diesen Online-Shop können Verbraucher Brennholz auswählen, Liefermöglichkeiten prüfen, Bestellungen aufgeben und Zahlungen durchführen.

Geltende Anforderungen:
[BFSG/BFSGV UND ANGEWANDTER STANDARD NACH RECHTLICHER UND TECHNISCHER PRÜFUNG]

Stand der Vereinbarkeit:
Der Online-Shop ist [VOLLSTÄNDIG/WEITGEHEND/TEILWEISE] mit den anwendbaren Anforderungen vereinbar.

Nicht barrierefreie Inhalte:
[KONKRETE LISTE, GRÜNDE UND GEPLANTE BEHEBUNG]

Erstellung dieser Information:
Diese Information wurde am [DATUM] erstellt und zuletzt am [DATUM] überprüft.
Methode der Prüfung: [SELBSTBEWERTUNG/EXTERNE PRÜFUNG]

Feedback und Kontakt:
Wenn Ihnen Barrieren auffallen, kontaktieren Sie uns:
[E-MAIL]
[TELEFON/POSTANSCHRIFT]

Zuständige Marktüberwachungsbehörde:
[AKTUELLE ZUSTÄNDIGE STELLE UND KONTAKTDATEN EINFÜGEN]
```

---

# 16. SEO

## 16.1 Technique

- métadonnées par page ;
- canonical ;
- sitemap XML ;
- robots.txt ;
- hreflang seulement si multilingue ;
- données structurées `Organization`, `Product`, `Offer`, `BreadcrumbList`, `Article` ;
- prix et stock structurés identiques à la page ;
- URLs stables ;
- redirections 301 ;
- images WebP/AVIF ;
- pagination indexable proprement ;
- pas d’indexation du panier, checkout, compte, recherche interne et filtres combinatoires.

## 16.2 Contenu

Sujets :

- `Welches Brennholz ist das beste?`
- `Raummeter und Schüttraummeter erklärt`
- `Buche oder Eiche als Brennholz`
- `Brennholz richtig lagern`
- `Welche Scheitlänge passt zu meinem Kamin?`
- `Holzfeuchte richtig verstehen`
- guides régionaux réellement utiles.

Ne pas faire de promesses environnementales vagues comme `100 % klimaneutral` sans preuves et méthodologie.

---

# 17. E-mails transactionnels

Tous en allemand, responsive et accessibles :

- `Bestellbestätigung`
- `Zahlungsbestätigung`
- `Zahlung fehlgeschlagen`
- `Bestellung wird vorbereitet`
- `Liefertermin`
- `Bestellung versandt`
- `Bestellung geliefert`
- `Stornierung`
- `Rückerstattung`
- `Passwort zurücksetzen`

Chaque message de commande contient les coordonnées du vendeur, le numéro, le résumé et les liens/documents juridiques nécessaires.

---

# 18. Tests et critères d’acceptation

## 18.1 Catalogue

- Le prix, le prix de base, l’unité et la quantité sont cohérents.
- Une variante indisponible ne peut pas être commandée.
- Une modification de produit ne modifie pas les anciennes commandes.

## 18.2 Livraison

- Un code postal autorisé retourne un tarif correct.
- Un code non autorisé bloque le checkout.
- Le tarif côté serveur correspond au panier.
- Les contraintes sont visibles avant paiement.

## 18.3 Paiement

- Aucun prix client n’est accepté sans recalcul serveur.
- Un webhook dupliqué ne crée pas deux commandes.
- Un paiement échoué ne décrémente pas définitivement le stock.
- Un remboursement est audité.

## 18.4 Juridique

- Liens légaux visibles dans le footer.
- Impressum accessible en deux clics maximum et en permanence.
- Prix TTC et frais affichés.
- Bouton `Zahlungspflichtig bestellen`.
- AGB/Widerruf envoyés sur support durable.
- Cookies facultatifs bloqués avant consentement.
- Refus aussi simple que l’acceptation.
- Retrait du consentement accessible.

## 18.5 Accessibilité

- Parcours complet au clavier.
- Checkout utilisable avec lecteur d’écran.
- Aucun piège clavier.
- Erreurs identifiées et expliquées.
- Audit automatisé sans erreur critique.
- Audit manuel sur mobile et desktop.

## 18.6 Performance

- LCP ≤ 2,5 s.
- INP ≤ 200 ms.
- CLS ≤ 0,1.
- Images adaptées.
- JavaScript client limité.

---

# 19. Déploiement

## 19.1 Objectif budgétaire

Objectif : aucun abonnement logiciel ou d’infrastructure à payer pendant le développement et la validation initiale. Seul le domaine GoDaddy est payé au départ.

Architecture initiale :

- code source : GitHub Free ;
- frontend et previews : Vercel ;
- backend : Supabase Free ;
- base de données : PostgreSQL Supabase Free ;
- authentification : Supabase Auth Free ;
- fichiers : Supabase Storage Free ;
- e-mails : Resend Free ;
- DNS : GoDaddy inclus avec le domaine ;
- certificats HTTPS : fournis automatiquement par la plateforme d’hébergement ;
- monitoring initial : journaux natifs et offres gratuites compatibles.

Cette architecture doit rester sous les quotas gratuits. Ajouter un tableau de suivi dans l’administration ou la documentation :

- e-mails envoyés aujourd’hui et ce mois ;
- espace base de données ;
- espace Storage ;
- bande passante ;
- utilisateurs actifs ;
- erreurs ;
- consommation de fonctions ;
- date du dernier export de sauvegarde.

## 19.2 Limite Vercel à ne pas ignorer

Le plan Vercel Hobby gratuit est officiellement limité à un usage personnel non commercial. Il peut être utilisé pour le développement, les previews, la démonstration et un pré-lancement sans transactions commerciales réelles, dans le respect de ses conditions.

Avant d’ouvrir effectivement les ventes, choisir l’une des deux solutions :

1. passer le projet sur Vercel Pro ;
2. déployer le même projet Next.js chez un hébergeur dont l’offre gratuite autorise explicitement l’usage commercial.

Ne pas promettre dans le planning qu’une boutique commerciale active pourra rester indéfiniment sur Vercel Hobby. Le code doit rester portable et éviter les dépendances exclusives inutiles à Vercel.

## 19.3 Absence de coûts initiaux et coûts liés aux ventes

« Gratuit au départ » signifie absence d’abonnement initial hors domaine, tant que les quotas et conditions sont respectés.

Cela n’élimine pas :

- les frais de transaction Stripe, PayPal ou d’un autre prestataire lors d’une vente ;
- les commissions de moyens de paiement ;
- la TVA, les taxes et obligations comptables ;
- les frais d’expédition ;
- les éventuels coûts LUCID/système dual ;
- les coûts d’un hébergement commercial lorsque la boutique passe en production réelle ;
- les dépassements de quotas ;
- les futurs renouvellements du domaine.

Le virement bancaire manuel peut être proposé sans abonnement de passerelle, mais il implique une vérification manuelle et ne supprime pas les frais bancaires éventuellement applicables.

Environnements :

- développement ;
- préproduction ;
- production.

Pipeline :

1. lint ;
2. typecheck ;
3. tests unitaires ;
4. tests d’intégration ;
5. tests E2E ;
6. audit dépendances ;
7. build ;
8. déploiement préproduction ;
9. smoke tests ;
10. approbation production.

Variables minimales :

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET_PRODUCTS=
SUPABASE_STORAGE_BUCKET_DOCUMENTS=
SUPABASE_STORAGE_BUCKET_INVOICES=
INVOICE_NUMBER_PREFIX=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO=
RESEND_ADMIN_EMAIL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
SENTRY_DSN=
ADMIN_EMAIL=
CRON_SECRET=
ORDER_TRACKING_SIGNING_SECRET=
```

Ne jamais exposer une clé secrète avec le préfixe `NEXT_PUBLIC_`. Utiliser les nouveaux noms de clés Supabase recommandés par la documentation au moment de l’implémentation. Si une clé historique `service_role` est utilisée, elle reste strictement côté serveur.

## 19.4 Déploiement Vercel

- connecter le dépôt GitHub au projet Vercel ;
- définir le framework Next.js ;
- ajouter toutes les variables par environnement ;
- ne jamais copier les secrets dans le code ;
- déployer automatiquement les branches en preview ;
- protéger les previews contenant des données sensibles ;
- utiliser une base Supabase de développement ou des données de test ;
- associer le domaine GoDaddy seulement à la production ;
- ajouter les URLs Vercel autorisées dans Supabase Auth ;
- tester les redirections d’authentification ;
- tester les webhooks avec l’URL de production ;
- utiliser les journaux Vercel pour le diagnostic sans y exposer de données personnelles ;
- prévoir une migration vers un hébergement commercial avant les ventes si le projet est encore sur Hobby.

## 19.5 Stratégie de secours

Le projet doit pouvoir être redéployé sans réécriture majeure :

- variables d’environnement standard ;
- migrations SQL conservées dans Git ;
- médias exportables ;
- aucune logique métier uniquement stockée dans un dashboard ;
- abstraction simple pour l’envoi des e-mails ;
- sauvegarde régulière des données ;
- documentation DNS ;
- procédure de restauration ;
- procédure de changement d’hébergeur.

---

# 20. Checklist avant ouverture

## Commerce

- [ ] Société et activité déclarées.
- [ ] TVA validée.
- [ ] Compte bancaire professionnel.
- [ ] Contrats fournisseurs.
- [ ] Assurance.
- [ ] Transporteur.
- [ ] Zones, délais et tarifs réels.

## Bois

- [ ] Provenance documentée.
- [ ] Lots traçables.
- [ ] Essence vérifiée.
- [ ] Humidité contrôlée.
- [ ] Unités définies.
- [ ] EUDR évalué.
- [ ] Import/phytosanitaire évalué si nécessaire.

## Granulés et briquettes

- [ ] Catégories séparées des bûches.
- [ ] Quantité nette et poids palette vérifiés.
- [ ] Prix de base au kilogramme affiché.
- [ ] Lot traçable.
- [ ] Fabricant/conditionneur identifié.
- [ ] Humidité documentée.
- [ ] Taux de cendres documenté.
- [ ] Pouvoir calorifique documenté.
- [ ] Certification vérifiée dans la source officielle.
- [ ] Identifiant et classe reproduits exactement.
- [ ] Autorisation d’usage du logo obtenue.
- [ ] DIN EN ISO 17225-2 évaluée pour les pellets.
- [ ] DIN EN ISO 17225-3 évaluée pour les briquettes.
- [ ] ISO/DIN EN ISO 17225-5 évaluée pour les bûches.
- [ ] Compatibilité avec l’appareil clairement indiquée.
- [ ] Conditions de stockage indiquées.
- [ ] Livraison sac/palette/vrac configurée.
- [ ] Images correspondant au vrai conditionnement.

## Emballages

- [ ] LUCID.
- [ ] Système dual.
- [ ] Quantités déclarées.
- [ ] Processus annuel.

## Juridique

- [ ] Impressum validé.
- [ ] AGB validées.
- [ ] Widerrufsbelehrung validée.
- [ ] Formulaire de rétractation.
- [ ] Datenschutz adaptée aux outils réels.
- [ ] Versand und Zahlung.
- [ ] Verbraucherstreitbeilegung vérifiée.
- [ ] BFSG évalué.
- [ ] Contrats de sous-traitance/AVV.

## Technique

- [ ] HTTPS.
- [ ] Sauvegardes testées.
- [ ] MFA admin.
- [ ] Webhooks signés.
- [ ] Rate limiting.
- [ ] E-mails testés.
- [ ] Facture PDF téléchargeable depuis la confirmation, le compte client, le suivi protégé et le dashboard.
- [ ] Factures stockées dans un bucket privé avec URLs signées de courte durée.
- [ ] Numérotation des factures unique, séquentielle et sûre en cas de commandes simultanées.
- [ ] Mentions fiscales, taux de TVA, montants nets/bruts et dates contrôlés par le conseiller fiscal.
- [ ] Snapshot comptable et fichier PDF immuables après émission.
- [ ] Annulation, correction et avoir testés sans suppression de la facture originale.
- [ ] Statuts `Offen`, `Bezahlt`, `Storniert` et `Erstattet` cohérents avec les paiements.
- [ ] Envoi Resend de la facture en pièce jointe ou par lien sécurisé testé.
- [ ] Accès à la facture refusé à tout client non autorisé.
- [ ] Tests de paiement réels à faible montant.
- [ ] Consentement cookies audité.
- [ ] Accessibilité auditée.
- [ ] SEO et données structurées validés.
- [ ] Monitoring et alertes.
- [ ] Projet Supabase Free créé.
- [ ] RLS activée et testée.
- [ ] Buckets publics/privés séparés.
- [ ] Resend Free configuré.
- [ ] Domaine d’envoi vérifié.
- [ ] SPF, DKIM et DMARC vérifiés.
- [ ] Quotas Resend surveillés.
- [ ] SMTP Supabase Auth configuré avec Resend.
- [ ] Domaine GoDaddy relié à l’hébergement.
- [ ] Domaine racine et `www` redirigés correctement.
- [ ] Variables Vercel séparées par environnement.
- [ ] Limitation commerciale de Vercel Hobby prise en compte.
- [ ] Solution d’hébergement commercial choisie avant ouverture des ventes.
- [ ] Export/sauvegarde Supabase testé.
- [ ] Aucun service optionnel payant activé automatiquement.
- [ ] Prestataires de paiement configurables.
- [ ] Virement bancaire manuel testé.
- [ ] Paiement manuel audité.
- [ ] Aucune donnée brute de carte stockée.
- [ ] SetupIntent/solution tokenisée testée.
- [ ] Consentement de sauvegarde du moyen de paiement enregistré.
- [ ] Nouveau prélèvement protégé par MFA et permissions.
- [ ] Webhooks signés et idempotents.
- [ ] Commande enregistrée avant les notifications externes.
- [ ] E-mail client envoyé.
- [ ] E-mail administrateur envoyé.
- [ ] Notification Telegram envoyée.
- [ ] Échec Resend/Telegram récupérable sans dupliquer la commande.
- [ ] CMS des pages légales versionné.
- [ ] Blog et révisions testés.
- [ ] Chat IA limité aux sources approuvées.
- [ ] Transfert vers un humain testé.
- [ ] Données sensibles interdites dans le chat.
- [ ] Suivi de commande protégé contre l’énumération.
- [ ] Timeline publique distincte des notes internes.

## Poêles à bois

- [ ] Documents du fabricant contrôlés.
- [ ] Marquage CE et déclaration pertinente disponibles.
- [ ] Conformité Ecodesign vérifiée.
- [ ] Conformité à la 1. BImSchV vérifiée.
- [ ] Étiquette énergétique et fiche produit disponibles.
- [ ] Fabricant, importateur et responsable UE affichés selon le cas.
- [ ] Avertissements GPSR affichés.
- [ ] Notices allemandes téléchargeables.
- [ ] Numéro de modèle, lot ou série traçable.
- [ ] Processus de rappel testé.
- [ ] Contenu de livraison clairement défini.
- [ ] Installation incluse ou exclue sans ambiguïté.
- [ ] Processus avec installateur et ramoneur défini.

---

# 21. Roadmap suggérée

## Sprint 0 — cadrage

- identité de l’entreprise ;
- zones ;
- fournisseur ;
- unités ;
- logistique ;
- fiscalité ;
- conformité.

## Sprint 1 — fondations

- projet Next.js ;
- projet Supabase Free et base de données ;
- Row Level Security ;
- Supabase Auth et Storage ;
- Resend et templates d’e-mails ;
- configuration DNS GoDaddy ;
- design system ;
- authentification admin ;
- CI/CD.

## Sprint 2 — catalogue

- catégories ;
- produits ;
- variantes ;
- stock ;
- poêles et attributs techniques ;
- documents de conformité ;
- comparaison de poêles ;
- pages publiques.

## Sprint 3 — panier et livraison

- panier ;
- code postal ;
- tarification ;
- contraintes.

## Sprint 4 — checkout

- coordonnées ;
- paiement ;
- webhooks ;
- commande ;
- e-mails.

## Sprint 5 — administration

- commandes ;
- produits ;
- stocks ;
- tarifs ;
- CMS ;
- pages légales versionnées ;
- blog ;
- paiements configurables ;
- virements et paiements manuels ;
- Telegram ;
- chat IA et support humain ;
- suivi de commande.

## Sprint 6 — conformité

- pages légales ;
- cookies ;
- RGPD ;
- BFSG/accessibilité ;
- prix de base ;
- documents de commande.

## Sprint 7 — QA et lancement

- sécurité ;
- performance ;
- E2E ;
- contenu ;
- SEO ;
- pilote sur zone limitée ;
- mise en production.

---

# 22. Sources officielles principales

- BGB § 312g — droit de rétractation : https://www.gesetze-im-internet.de/bgb/__312g.html
- EGBGB Art. 246a § 1 — informations précontractuelles : https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html
- DDG § 5 — informations générales/Impressum : https://www.gesetze-im-internet.de/ddg/__5.html
- PAngV : https://www.gesetze-im-internet.de/pangv_2022/
- 1. BImSchV : https://www.gesetze-im-internet.de/bimschv_1_2010/
- BFSG : https://www.gesetze-im-internet.de/bfsg/
- FAQ BFSG officielle : https://www.bundesfachstelle-barrierefreiheit.de/DE/Barrierefreiheitsstaerkungsgesetz/FAQ/faq_node
- LUCID et emballages : https://www.verpackungsregister.org/themen/versand-und-onlinehandel
- TDDDG/cookies — BfDI : https://www.bfdi.bund.de/SharedDocs/Downloads/DE/DSK/Orientierungshilfen/OH_Digitale-Dienste.pdf
- Règlement EUDR consolidé : https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02023R1115-20251226
- Règlement Ecodesign (UE) 2015/1185 : https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32015R1185
- Étiquetage énergétique (UE) 2015/1186 : https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32015R1186
- Règlement général sur la sécurité des produits (UE) 2023/988 : https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32023R0988
- FAQ officielle allemande sur la sécurité des produits : https://www.bundesumweltministerium.de/themen/chemikaliensicherheit/sicherheit-bei-produkten/sicherheit-bei-verbrauchernahen-produkten/fragen-und-antworten-zur-allgemeinen-eu-produktsicherheitsverordnung-vo-eu-nr-2023/988
- ENplus — système de qualité des granulés : https://enplus-pellets.eu/quality_scheme/
- DIN — DIN EN ISO 17225-2, granulés de bois : https://www.din.de/
- DIN — DIN EN ISO 17225-3, briquettes de bois : https://www.din.de/
- DIN/ISO — ISO 17225-5, bûches/Stückholz : https://www.din.de/
- Vercel Hobby et restriction d’usage commercial : https://vercel.com/docs/plans/hobby
- Vercel Fair Use Guidelines : https://vercel.com/docs/limits/fair-use-guidelines
- Supabase Billing FAQ et projets Free : https://supabase.com/docs/guides/platform/billing-faq
- Supabase Auth Rate Limits : https://supabase.com/docs/guides/auth/rate-limits
- Quotas Resend : https://resend.com/docs/knowledge-base/account-quotas-and-limits
- Gestion DNS GoDaddy : https://www.godaddy.com/help/manage-dns-records-680
- Stripe — sauvegarder et réutiliser un moyen de paiement : https://docs.stripe.com/payments/save-and-reuse
- Stripe Setup Intents et consentement : https://docs.stripe.com/payments/setup-intents
- Stripe — sécurité et PCI DSS : https://docs.stripe.com/security/guide
- Telegram Bot API : https://core.telegram.org/bots/api
- Resend — clés d’idempotence : https://resend.com/docs/dashboard/emails/idempotency-keys
- UStG § 14 — établissement et mentions des factures : https://www.gesetze-im-internet.de/ustg_1980/__14.html
- UStG § 14b — conservation des factures : https://www.gesetze-im-internet.de/ustg_1980/__14b.html
- UStDV § 33 — factures de faible montant : https://www.gesetze-im-internet.de/ustdv_1980/__33.html
