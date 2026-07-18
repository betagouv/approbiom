# Approbiom - Système national d’enregistrement et d’instruction des plans d’approvisionnement biomasse

Approbiom est un service qui facilite la production d’avis solides, traçables et comparables sur les plans d'approvisionnement biomasse.

Voir : https://beta.gouv.fr/startups/base-de-donnees-plan-d-appro-biomasse.html

Ce répertoire contient plusieurs custom widgets Grist utilisés dans le Grist d'Approbiom.

## Pré-requis

* **Node.js `^20.19.0 || >=22.12.0`** — version exigée par Vite 8. Le projet est
  développé sous Node 24, version fixée dans `.nvmrc` : avec nvm, un
  `nvm use` à la racine sélectionne la bonne version. Vérifier avec `node -v`.
* **pnpm `>=10`** — vérifier avec `pnpm -v`. Installation :
  `corepack enable pnpm`, ou voir https://pnpm.io/installation.

npm et yarn ne sont pas supportés : seul `pnpm-lock.yaml` est versionné.

## Guide d'installation

Lancer :

```bash
pnpm install
```

## Guide de développement

Pré-requis : pour tester les widgets, installer Grist Desktop.

Voir : https://github.com/gristlabs/grist-desktop/releases

Puis lancer :

```bash
pnpm run dev
```

## Guide de déploiement

Pour déployer sur l'environnement de staging, lancer :

```bash
pnpm run build:staging
```

Pour promouvoir la version en production, lancer :

```bash
pnpm run build:prod
```
