# Approbiom - Système national d’enregistrement et d’instruction des plans d’approvisionnement biomasse

Approbiom est un service qui facilite la production d’avis solides, traçables et comparables sur les plans d'approvisionnement biomasse.

Voir : https://beta.gouv.fr/startups/base-de-donnees-plan-d-appro-biomasse.html

Ce répertoire contient plusieurs custom widgets Grist utilisés dans le Grist d'Approbiom.

## Pré-requis

- **Node.js `^20.19.0 || >=22.12.0`** — version exigée par Vite 8. Le projet est
  développé sous Node 24, version fixée dans `.nvmrc` : avec nvm, un
  `nvm use` à la racine sélectionne la bonne version. Vérifier avec `node -v`.
- **pnpm `>=10`** — vérifier avec `pnpm -v`. Installation :
  `corepack enable pnpm`, ou voir https://pnpm.io/installation.

npm et yarn ne sont pas supportés : seul `pnpm-lock.yaml` est versionné.

## Guide d'installation

Lancer :

```bash
pnpm install
```

## Guide de développement

### Mise en place de l'environnement de développement

L'environnement de développement lance en local, avec Docker, la même image Grist que Grist.gouv (`lasuite/grist`), ainsi qu'un serveur nginx qui expose la liste des widgets de développement.

Pré-requis : installer Docker ou Docker Desktop.

1. Créer le fichier `dev/.env` à partir du modèle, puis l'adapter :

```bash
cp dev/.env.example dev/.env
```

2. Lancer Grist et le serveur de widgets :

```bash
docker compose -f dev/docker-compose.yml --env-file dev/.env up -d
```

Grist est accessible sur http://localhost:8484. Le premier démarrage peut prendre une minute.

3. Servir les widgets du repository :

```bash
pnpm run dev
```

4. Dans Grist, importer le document de production (fichier `.grist` téléchargé depuis Grist.gouv), puis ajouter une vue personnalisée et choisir le widget `[DEV] …` dans la liste.

Pour arrêter l'environnement :

```bash
docker compose -f dev/docker-compose.yml --env-file dev/.env down
```

### Création d'un nouveau widget

Pour créer un nouveau widget "mon-widget" :

1. Créer le dossier "mon-widget" dans le dossier `widgets`
2. Dans le dossier `mon-widget`, créer un fichier `index.html`. Si le widget lit ou écrit dans Grist, mettre le script de l'API Plugin de Grist.

```tsx
<script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
```

3. Rajouter le widget à la liste des widgets disponibles : à la racine du projet, dans le fichier `index.html`, ajouter le lien vers le nouveau widget "mon-widget".
4. Initialiser le widget : dans le dossier `mon-widget/src`, créer les fichiers `main.tsx` qui appelle le composant `App.tsx`.
5. Pour communiquer avec Grist, on utilise l'API Plugin de Grist. Charger les données dans un fichier `mon-widget/src/load-mon-widget.ts`, qui exporte une fonction `loadMonWidget(ports)`. Dans `App.tsx`, l'appeler via le hook `useAsyncState` et afficher le résultat avec le composant `AsyncGate`.

### Utiliser le DSFR

Pour importer la couche de style du DSFR et le reset commun à tous les widgets : dans le fichier `mon-widget/src/main.tsx`, rajouter les lignes d'import suivantes :

```tsx
import '@gouvfr/dsfr/dist/core/core.main.min.css'
import '@shared/react/base.css'
```

## Guide de déploiement

Les widgets Grist sont hébergés sur GitHub Pages et accessibles via les URLs suivantes

- **Production** : https://betagouv.github.io/approbiom/prod/
- **Staging** : https://betagouv.github.io/approbiom/staging/

Les fichiers servis se trouvent dans les dossiers "staging" et "prod" du dossier "dist".
On peut retrouver ces dossiers sur la branche "gh-pages".

Le déploiement de "staging" est automatique et s'effectue dès qu'un commit est fusionné sur la branche "main".
Le déploiement de "prod" est manuellement déclenché par la GitHub Action CD Pipeline. Cette action promouvoit la prod, c'est-à-dire qu'elle copie le contenu du dossier staging vers le dossier prod.

Pour améliorer le processus de déploiement continu, il reste à implémenter une GitHub Action dédiée au rollback de l'environnement de production.
