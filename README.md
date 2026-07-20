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

Pré-requis : pour tester les widgets, installer Grist Desktop.

Voir : https://github.com/gristlabs/grist-desktop/releases

Puis lancer :

```bash
pnpm run dev
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
