# HOLZKRAFT

Boutique e-commerce allemande de bois de chauffage, granulés, briquettes, poêles à bois et accessoires.

Le dépôt est actuellement en phase de cadrage. Les documents ci-dessous constituent la source de vérité avant le scaffold de l’application.

## Commencer ici

1. Lire [AGENTS.md](AGENTS.md).
2. Lire [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).
3. Pour le frontend, lire [.ulpi/design/DESIGN.md](.ulpi/design/DESIGN.md) puis [.ulpi/design/storefront.md](.ulpi/design/storefront.md).
4. Pour le backend, lire [docs/BACKEND.md](docs/BACKEND.md) puis [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
5. Choisir la première tâche non terminée dans [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Documents sources

- [PRD_NextJS_Brennholz_Deutschland.md](PRD_NextJS_Brennholz_Deutschland.md) : exigences produit, métier, juridiques et techniques.
- [PROMPT_UIUX.md](PROMPT_UIUX.md) : périmètre visuel et interactions simulées du prototype.
- [Sources_Produits_Bois_Poeles_Allemagne.md](Sources_Produits_Bois_Poeles_Allemagne.md) : fournisseurs, références et règles de droits d’utilisation.
- [logo.png](logo.png) : logo fourni, à préserver comme source.

## Règle de priorité

En cas de conflit :

1. sécurité, droit applicable et protection des données ;
2. PRD ;
3. architecture et backend ;
4. design verrouillé ;
5. prompt UI/UX historique.

Le prompt UI/UX interdit le backend parce qu’il décrit un prototype visuel. Cette restriction ne s’applique pas à l’application complète prévue par le PRD.

## Configuration Codex

- Instructions persistantes : `AGENTS.md`
- Configuration projet et MCP : `.codex/config.toml`
- Skills projet : `.agents/skills/`
- Design verrouillé : `.ulpi/design/`

Le projet doit être marqué comme fiable dans Codex pour charger `.codex/config.toml`. Redémarrer Codex après une modification de MCP ou l’installation de nouveaux skills.
