# MCP du projet

La configuration active se trouve dans `.codex/config.toml`.

## Serveurs

| Serveur | Usage | Mutation externe |
| --- | --- | --- |
| `openaiDeveloperDocs` | Documentation officielle OpenAI et Codex | non |
| `context7` | Documentation actuelle Next.js, Supabase, Stripe, Resend et bibliothèques | non |
| `playwright` | Inspection et automatisation du navigateur en mode isolé/headless | navigateur local |

## Démarrage

1. Marquer le projet comme fiable dans Codex.
2. Vérifier que Node.js et `npx` sont disponibles.
3. Redémarrer Codex après la première configuration.
4. Exécuter `codex mcp list`.
5. Dans le TUI, utiliser `/mcp` pour vérifier l’initialisation.

Les serveurs ne sont pas `required` afin qu’un incident de documentation ou de navigateur n’empêche pas l’agent de travailler sur des fichiers locaux.

## Politique

- Documentation : approbation automatique.
- Playwright : demander selon le caractère écrivant de l’outil.
- Aucun secret n’est écrit dans le TOML.
- Ajouter une clé Context7 uniquement comme variable d’environnement si les limites anonymes deviennent insuffisantes.
- Ne pas connecter une production, une boîte mail, un paiement live ou un stockage réel sans demande explicite.

## Dépannage

- `codex mcp list` : état de la configuration.
- `codex mcp --help` : commandes disponibles.
- Supprimer le cache npm du serveur n’est pas une première action ; relancer Codex puis vérifier Node et le réseau.
- Si Playwright ne trouve pas de navigateur, installer le navigateur requis depuis le projet après le scaffold et documenter la commande exacte.
- Si un serveur demande OAuth, utiliser `codex mcp login <nom>` uniquement pour un service explicitement autorisé.
