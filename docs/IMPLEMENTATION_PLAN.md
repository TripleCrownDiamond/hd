# Plan d’implémentation

Une seule tranche peut être `in_progress`. Une tranche n’est `done` qu’après mise à jour de l’état projet et exécution des validations prévues.

## Sprint 0 — Cadrage

- [x] `S0.1` Consolider les sources et priorités.
- [x] `S0.2` Verrouiller le design language.
- [x] `S0.3` Définir architecture et backend.
- [x] `S0.4` Configurer Codex, skills et MCP.
- [ ] `S0.5` Obtenir les décisions métier listées dans `PROJECT_STATUS.md`.

## Sprint 1 — Fondations

- [x] `S1.1` Scaffold Next.js, TypeScript strict, pnpm, Tailwind, tests.
- [x] `S1.2` Installer Radix/shadcn et encoder les tokens.
- [x] `S1.3` Ajouter Supabase local, migrations initiales et génération de types.
- [x] `S1.4` Créer les layouts publics, compte, légal et admin.
- [x] `S1.5` Mettre en place CI : lint, types, unitaires, E2E, build.

## Sprint 2 — Catalogue

- [x] `S2.1` Modèle catégories, produits, variantes et médias.
- [ ] `S2.2` Conformité, opérateurs économiques et documents. (`in_progress` :
      HKI résolu 22/28, 40 références `hki_devices`, contrôles `verified` avec
      certificats liés ; 6 produits manquants en revue manuelle ; marque seule
      affichée, opérateurs économiques exclus par décision ADR-012 ; scraping
      fabricants autorisé le 31/07/2026 pour toutes les sources et exécuté
      `--all` : RIKA 40, Austroflamm 72, Jøtul 137, Wodtke 37, Max Blank 75,
      Ofen Koppe 10, Skantherm 20, Camina 49 — tous `pending`, non publiés ;
      importés en base le 01/08/2026 avec 100 % de couverture image)
- [ ] `S2.3` Accueil et navigation globale. (`todo` : section poêles enrichie
      avec 9 cartes autorisées, badges factuels et chargement progressif vers le
      catalogue ; loader global et skeletons dédiés aux fiches, listes locales
      et panier accessibles ; les médias produit accueil/mega-menu sont carrés
      et recadrés en `cover` ; les autres sections restent à finaliser)
- [ ] `S2.4` Catalogue bois et fiche bois. (`in_progress` : `/brennholz`,
      `/anzuendholz`, `/holzbriketts`, `/holzpellets` partagent `FuelCatalog`
      avec facettes calculées ; fiche `/brennholz/[slug]` créée ; 194 produits
      bois + 7 Anzündholz + 1 Brikett importés, tous avec image, tous `pending`.
      Cartes et grilles durcies contre les débordements ; lectures catalogue
      cachées 5 minutes et transition App Router avec skeleton. Reste : tri,
      pagination, moteur de filtres actif et calcul livraison)
- [ ] `S2.5` Catalogue poêles, fiche poêle et comparateur. (`todo` :
      aperçu local Supabase des 87 produits en revue ; HARK avec prix fabricant et
      184 médias autorisés, Spartherm sur devis ; publication et comparateur
      bloqués jusqu'à validation réglementaire ; cartes/grille durcies contre
      les débordements et lecture catalogue cachée 5 minutes ; Merkliste et
      comparateur local fonctionnels, avec instantanés techniques persistés et
      maximum de 4 modèles sans relecture du catalogue complet ; descriptions
      HTML remontées dans la zone d'achat, catalogue audité et 56 héros `ofen.de`
      corrigés avec seuil de confiance strict ; cartes, fiches, Merkliste et
      comparaison utilisent des médias carrés `cover`.)
- [ ] `S2.6` Granulés, briquettes et accessoires.

## Sprint 3 — Panier et livraison

- [ ] `S3.1` Moteur de devis par code postal.
- [ ] `S3.2` Panier persistant et recalcul serveur. (`in_progress` : store local,
      ajout depuis les fiches bois/accessoire/poêle, variantes, quantités,
      suppression, sous-total et liens produit fonctionnels ; activation
      limitée aux produits `approved` avec prix public ; image produit carrée
      persistée et affichée dans le mini-panier et le panier. Reste : recalcul
      serveur, disponibilité et branchement au devis de livraison.)
- [ ] `S3.3` Inventaire, lots et réservations expirables.
- [ ] `S3.4` Parcours et tests E2E livraison/panier.

## Sprint 4 — Checkout

- [ ] `S4.1` Commande, snapshots et versions juridiques.
- [ ] `S4.2` Adaptateur paiement et Stripe sandbox.
- [ ] `S4.3` Virement bancaire et paiement manuel.
- [ ] `S4.4` Webhooks signés et idempotents.
- [ ] `S4.5` Checkout accessible et confirmation. (`todo` : route `/kasse` non
      implémentée ; réutiliser le média produit carré `cover` dans le
      récapitulatif lorsqu'elle sera construite.)

## Sprint 5 — Opérations

- [ ] `S5.1` Auth, RBAC, MFA admin et audit. (`in_progress` : toutes les routes
      admin exigent maintenant un rôle et les mutations sont auditées ; reste
      l'enrôlement MFA et les écrans de gestion des rôles.)
- [ ] `S5.2` Dashboard produits, stock et commandes. (`in_progress` : dashboard
      réel, CRUD produit avec archivage, gestion des statuts commande et vue
      clients ; restent variantes/médias, stock, exports et détail commande.)
- [ ] `S5.3` CMS, blog et versions juridiques. (`in_progress` : pages, articles
      et textes légaux avec révisions, Rich Text/Markdown/HTML et preview ;
      publication storefront branchée.)
- [ ] `S5.4` Resend, Telegram et file de notifications.
- [ ] `S5.5` Factures PDF immuables et accès protégé. (`in_progress` : schéma,
      RLS, liste admin et verrou d'immuabilité ; émission, séquence et PDF
      bloqués jusqu'à validation fiscale.)
- [ ] `S5.6` Suivi commande signé.
- [ ] `S5.7` Chat IA borné et transfert humain.

## Sprint 6 — Conformité et qualité

- [ ] `S6.1` Cookies et consentements.
- [ ] `S6.2` Audit WCAG 2.2 AA.
- [ ] `S6.3` Sécurité, RLS, secrets et rate limits.
- [ ] `S6.4` SEO, données structurées et performance.
- [ ] `S6.5` Processus rappel produit et export.

## Sprint 7 — Lancement

- [ ] `S7.1` Remplacer les fixtures par les données autorisées.
- [ ] `S7.2` Validation juridique et fiscale.
- [ ] `S7.3` Pilote sur zone limitée.
- [ ] `S7.4` Hébergement commercial, sauvegarde et restauration.
- [ ] `S7.5` Smoke tests et ouverture contrôlée.
# Tranche terminée 2026-08-02 — Commerce assisté et documents

- [x] Promotions administrables et recalcul serveur jusqu'à la commande.
- [x] FAQ administrable et publique.
- [x] Assistant flottant contextuel, RAG sur sources approuvées et connecteur Mistral optionnel.
- [x] Panier abandonné avec consentement, restauration, désinscription et ordonnanceur Resend idempotent.
- [x] Facturation PDF dynamique, numérotation atomique et stockage privé immuable.
- [x] Typecheck, lint, tests, build et inspection visuelle du PDF.
- [ ] Démarrer Docker Desktop puis appliquer/tester la migration locale et exécuter les parcours Playwright admin/storefront.
