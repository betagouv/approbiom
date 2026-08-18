Title: These documents have names that are short noun phrases. For example, "ADR 1: Deployment on Ruby on Rails 3.0.10" or "ADR 9: LDAP for Multitenant Integration"

Context: This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts.

Decision: This section describes our response to these forces. It is stated in full sentences, with active voice. "We will …"

Status: A decision may be "proposed" if the project stakeholders haven't agreed with it yet, or "accepted" once it is agreed. If a later ADR changes or reverses a decision, it may be marked as "deprecated" or "superseded" with a reference to its replacement.

Consequences: This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future.

# 3. Hexagonal architecture

Date: 2026-18-08

## Status

Accepted

## Context

On souhaite séparer la logique métier de l'interface et de l'infrastructure. Cette séparation a pour but de :

- Faciliter un potentiel changement d'infrastructure. Aujourd'hui, on utilise Grist comme back-end et base de données, mais l'utilisation de cet outil est un test.
- Faciliter l'implémentation de nouveau widget sans réinventer la roue.
- Garantir le métier. Pouvoir tester facilement la logique métier indépendant des outils externes. L'essentiel des enjeux de cette application, qui est un MVP, se situe dans la logique métier, les règles de l'administration, des instructions des agents de la CRB qui sont encore à définir.
- Lien avec grist robuste -> si erreur dans une ligne de table grist, ça casse pas côté application
- Avoir un document qui explique facilement comment ajouter un widget, une feature

## Decision

architecture hexagonal
pas de séparatio nen modules pour l'instant car on ne sait pas encore edactement quelles parties du domaine métier sont gloaledment indépendants les uns des autres. On ne connait pas encore les uses cases
avec leur propre vocabulaire, leurs propres règles et leurs propres use cases

core = le coeur de l'application métiers

- application :
  -- ports : interface/contrat de ce qui peut être demandé par l'application (driver port) ou ce qui peut être demandé à l'application (driving port)
  -- services : xxx
- domain : ensemble des objets et des règles métiers
  -- entité : object métier + identifiant. ensemble d'attribut (ce qu'est et connaît) et de behaviour (ce que peut faire)
  -- value object : attribut ou behaviour immutable, sans identifiant qui définit et force des contraintes dans l'app. Un concept bien défini (par exemple : les régions, la localisation...)

ici j'appelle "application" ...

Que faire quand :

- Mon application a besoin d'une donnée par encore récupérer
  Créer les Entities seulement si elles ont un vrai sens métier et n’existent pas déjà : Plan, Installation.
  Créer les ports dont le service a besoin pour lire les données : PlanReader, InstallationReader.
  Créer le service applicatif GetPlanDetails, qui appelle ces ports et compose les deux objets si besoin de composer deux objets.
  Créer les adapters Grist qui implémentent les ports.
  Le widget appelle directement GetPlanDetails.

- Mon interface a besoin d'une donnée de mon application
- Je veux créer un widget

plus tard

- Mon interface a besoin de modifier une entité de mon application

Le domain ne doit pas connaître le framework pour l'interface, ni l'infrastructure

Ressource : https://github.com/Sairyss/domain-driven-hexagon#value-objects

## Consequences

See Michael Nygard's article.
