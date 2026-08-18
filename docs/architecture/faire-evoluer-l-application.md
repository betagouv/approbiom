# Faire évoluer l'application

Guide pratique pour ajouter une donnée, un cas d'usage ou une règle métier.
Complète l'[ADR 3](../adr/0003-hexagonal-architecture.md), qui explique le
_pourquoi_ ; ce document explique le _comment_.

## La règle en une phrase

Le widget appelle un **service applicatif**, qui appelle des **ports**, que les
**adapters Grist** implémentent. Personne ne saute une étape, et la
composition se fait toujours dans le service.

```text
widgets/accueil          →  core/application/services  →  core/application/ports
(React, aucune donnée        (compose, applique les          (interfaces)
 Grist, aucun code)           règles)                              ↑
                                                            shared/grist
                                                            (adapters)
```

Ce que chaque couche a le droit de connaître :

| Couche             | Connaît                         | Ne connaît pas                   |
| ------------------ | ------------------------------- | -------------------------------- |
| `widgets/*`        | les services applicatifs, React | Grist, les ports, les tables     |
| `core/application` | les ports, le domaine           | Grist, React, les noms de tables |
| `core/domain`      | lui-même                        | tout le reste                    |
| `shared/grist`     | les ports, les tables Grist     | React, les services              |

---

## Cas 1 — Mon interface a besoin d'une nouvelle donnée

Exemple : afficher la date de dépôt d'un plan.

**1. Où définir le besoin ?**
Dans le service applicatif qui sert l'écran, `core/application/services/`.
C'est le read model retourné par le service qui décrit ce dont l'écran a
besoin — pas l'entité, pas le widget.

**2. Quel port créer ?**
Aucun, si la donnée vient d'une table déjà lue : ajouter le champ au port
existant. Un nouveau port seulement si c'est une **nouvelle source**.
Un port = une source de données, pas un écran.

```ts
// core/application/ports/plan-d-approvisionnement.ts
export interface PlanQuery {
    list(): Promise<readonly Plan[]>
}
```

**3. Où récupérer et transformer la donnée ?**
Dans l'adapter, `shared/grist/`. Il fait de la **traduction uniquement** :
lire la colonne, la convertir au bon type. Aucune règle métier, aucun join
entre plusieurs concepts.

```ts
// shared/grist/grist-plan-query.ts
dateDepot: asDate(row.Date_depot),
```

Si la colonne peut être vide, l'adapter **décide** ce que ça veut dire. Il ne
renvoie pas `undefined` en laissant l'UI trancher : sinon chaque écran invente
sa propre valeur par défaut, et ils finissent par ne plus être d'accord.

**4. Comment l'exposer au widget ?**
Le service la met dans son read model. Le widget la lit. Il n'a rien d'autre
à faire — il ne sait pas d'où elle vient.

> ⚠️ Si vous ajoutez un champ à une **entité** du domaine, demandez-vous
> d'abord s'il a un sens métier. Sinon, il appartient au read model du
> service, pas à l'entité.

---

## Cas 2 — Mon interface a besoin d'un nouveau cas d'usage

Exemple : le widget veut les statistiques d'approvisionnement d'un plan.

**1. Créer une fonction dans `core/application/services/`.**
Une fonction, pas une classe, pas un handler. Elle prend les ports dont elle a
besoin et retourne un read model prêt à afficher.

```ts
// core/application/services/approvisionnement-stats.ts
export type ApprovisionnementStatsPorts = {
    approvisionnements: ApprovisionnementQuery
    ressources: RessourceQuery
    entreprises: EntrepriseQuery
    insee: InseeQuery
}

export async function getApprovisionnementStats(
    ports: ApprovisionnementStatsPorts,
    plan: Plan['id']
): Promise<ApprovisionnementStats> {
    // 1. lire les ports, en parallèle
    // 2. composer (fonction pure, testée à part)
    // 3. retourner un read model avec des libellés, pas des codes
}
```

Le type est nommé d'après ce qu'il mesure — les approvisionnements — et non
d'après l'écran qui l'affiche. Attention au piège : `PlanApprovisionnementStats`
se lirait « statistiques d'un plan d'approvisionnement », alors qu'il s'agit des
approvisionnements _d'un_ plan. Le plan est porté par un champ, pas par le nom.

**2. Le widget l'appelle directement.**

```tsx
const state = useAsyncData(() => getApprovisionnementStats(ports, plan.id))
```

Le widget ne sait pas combien de tables ont été lues, ni si Grist a fait
l'agrégation ou si le service l'a calculée. C'est le but.

**3. Le read model porte des libellés, pas des codes.**
Si le widget doit faire `nomsParSiret.get(row.fournisseur)`, la résolution est
au mauvais endroit : c'est au service de la faire.

**Ne créez pas** de port + service + handler + repository quand une couche ne
fait que déléguer. Un service qui appelle des ports suffit.

---

## Cas 3 — Je veux ajouter une nouvelle fonctionnalité métier

Exemple : une règle qui dit si un plan est instruisable.

**1. La règle porte-t-elle sur un seul objet métier ?**
→ Elle va dans l'entité, `core/domain/entities/`, à côté de ses attributs.
C'est ce qui a été fait pour la chronologie d'une instruction : où en est une
instruction se déduit de sa phase et de ses dates, donc c'est un comportement
de `Instruction`, pas un objet à part.

**2. La règle contraint-elle une valeur ?**
→ C'est un value object, `core/domain/value-objects/` : un ensemble fermé de
valeurs, avec son type guard. Voir `avis-crb.ts`, `usage.ts`.

**3. La règle croise-t-elle plusieurs sources ?**
→ Elle va dans le service applicatif, `core/application/services/`. C'est le
cas de « un fournisseur revient une fois par ressource, donc il faut le
dédoublonner » : ça ne tient pas dans une seule entité.

**4. Dans tous les cas : testez sans Grist.**
Les règles métier se testent avec des objets simples, jamais avec un adapter
ni un double de port. Si un test a besoin de Grist pour vérifier une règle,
c'est que la règle est au mauvais endroit.

```ts
// core/domain/entities/instruction.test.ts — aucun port, aucun mock
expect(getEtapes(instruction({ phase: 'Avis préfet rendu' }))).toEqual(…)
```

Pour cette raison, un service se découpe en deux : une fonction **pure** qui
compose (testée directement) et une fonction **async** qui lit les ports et
l'appelle.

---

## Les pièges déjà rencontrés

- **Nommer un objet du core d'après un écran.** `PlanAccueil` obligeait le
  core à connaître le widget accueil. C'est devenu `PlanDetail`.
- **Faire porter au port le nom de la table Grist.** Un port exprime la
  question posée, pas la façon dont Grist y répond. Les tables `_summary_`
  restent un détail de `shared/grist/`.
- **Laisser `undefined` traverser les couches.** Une cellule Grist illisible
  doit être tranchée par l'adapter, sinon chaque écran invente sa valeur par
  défaut.
- **Mettre la composition dans le widget ou dans `shared/react`.**
  Elle appartient au service applicatif : c'est ce qui la rend testable et
  réutilisable par un autre widget.
