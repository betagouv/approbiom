# Widget Saisir des approvisionnements

## Contexte

### Rappel spécification métier

Un plan est lié à un ou plusieurs approvisionnements.
Un approvisionnement est lié à un plan, un fournisseur, une ressource, une provenance (un département ou un pays étranger) et un tonnage (le tonnage approvisionné).

### Besoin principal

Les agents ont besoin de créer, corriger et contrôler facilement les approvisionnements d'un plan choisi.

Cette saisie est fastidieuse pour plusieurs raisons :

- Un plan peut avoir plusieurs dizaines d'approvisionnements.
- Les données demandées (provenance, fournisseur, tonnage...) ne sont pas toujours connues des agents.
- On veut des données propres (par exemple, siret qui provient de l'annuaire des entreprises).

Ce widget permet de saisir les approvisionnements à la main, de les modifier, de repérer les doublons et de contrôler la répartition du tonnage du plan.

La création d'approvisionnements à partir d'un document (comme les documents de l'Ademe BCIB/BCIAT) se fait dans le widget `approvisionnements-import-document`.

### Pourquoi les widgets natifs de Grist ne suffisent pas

- Utiliser le widget "formulaire interne" dégrade l'expérience utilisateur.
    - Impossibilité de créer plusieurs approvisionnements à la fois.
    - L'utilisateur doit systématiquement sélectionner le plan auquel ils sont liés, au lieu de le faire une seule fois.
    - Sélectionner un plan avec le sélecteur est compliqué.
- La fonctionnalité à intégrer est avancée : repérage des doublons, contrôle de la répartition du tonnage par provenance et par fournisseur, création d'un fournisseur à partir de son SIRET.

## Fonctionnalité du widget

### Objectifs principaux

Créer, modifier, dupliquer, supprimer et consulter des lignes dans Approvisionnements à partir d'un plan sélectionné.

Aucune action de vérification supplémentaire en dehors de ce custom widget ne doit être nécessaire pour valider les données des approvisionnements d'un plan.

### Tests E2E

Les tests E2E sont à faire avec un utilisateur de Grist qui possède le rôle "éditeur".

#### Parcours

1. Je sélectionne le plan d'approvisionnement.
2. Je vois ses approvisionnements. S'il y a des lignes avec les mêmes fournisseur, ressource et provenance, je suis alertée.
3. J'appuie sur « Ajouter des approvisionnements » : le formulaire de saisie manuelle s'ouvre directement.
4. Je remplis le formulaire et je crée l'approvisionnement ; il apparaît dans le tableau.
5. Je corrige, duplique ou supprime des lignes depuis le tableau.
6. Je contrôle la répartition du tonnage dans l'onglet Synthèse.

#### Liste des tests

##### 1. Choisir un plan

- **1.1** Ouvrir le widget → titre « Saisir des approvisionnements » et champ de recherche « Plan d'approvisionnement »
- **1.2** Taper une partie du nom d'un plan, sans tenir compte des majuscules ni des accents (« hopital » trouve « Hôpital ») → la liste ne propose que les plans dont le nom contient ce texte
- **1.3** Taper un texte qui ne correspond à aucun plan → aucun plan proposé
- **1.4** Cliquer sur « Changer de plan » → la recherche réapparaît avec le curseur dedans, et un lien « Revenir au plan « … » »
- **1.5** Cliquer sur « Revenir au plan « … » » → retour au même plan, sans changement

##### 2. Consulter les approvisionnements

- **2.1** Regarder le tableau → colonnes Actions, Contrôle, Fournisseur, Ressource, Provenance, Tonnage (t MV/an)
- **2.2** Regarder une ligne → ressource sous la forme « code · description » ; provenance « Corrèze (19) » pour un département ou le nom du pays ; tonnage aligné à droite au format français (« 1 200,5 »)
- **2.3** Regarder une ligne sans fournisseur → « Non renseigné »
- **2.4** Survoler les icônes d'actions → infobulles « Modifier », « Dupliquer », « Supprimer »
- **2.5** Ouvrir un plan sans doublon → chaque ligne affiche « Pas de doublon », sans bloc d'erreur
- **2.6** Ouvrir un plan où deux lignes ont le même fournisseur, la même ressource et la même provenance → elles affichent le même badge « Doublon A » et se suivent dans le tableau, avec un bloc « 1 doublon à corriger »
- **2.7** Regarder deux lignes sans fournisseur, avec la même ressource et la même provenance → elles sont aussi marquées comme doublons
- **2.8** Cliquer sur « Afficher uniquement les doublons » → seules les lignes en doublon restent ; le bouton devient « Afficher toutes les lignes » et remet toutes les lignes
- **2.9** Ouvrir un plan sans approvisionnement → « Aucun approvisionnement pour ce plan », avec la proposition de les ajouter par saisie manuelle, que le plan ait une pièce jointe ou non
- **2.10** Ouvrir un plan qui a une extraction de document en cours → aucun bandeau « Extraction en cours » ; la reprise se fait dans le widget `approvisionnements-import-document`

##### 3. Ajouter, modifier, dupliquer, supprimer

**Ajouter**

- **3.1** Cliquer sur « Ajouter des approvisionnements », en bas à droite du tableau → le formulaire de saisie manuelle s'ouvre directement, sans choix entre saisie manuelle et document
- **3.2** Regarder le formulaire → un avertissement toujours affiché : si le document ne donne pas de provenance, il faut indiquer le département de l'installation ; la provenance se choisit parmi les départements et les pays existants, sans bouton pour créer un pays
- **3.3** Remplir ressource, provenance et tonnage, puis « Créer l'approvisionnement » → la ligne apparaît dans le tableau, avec le message « Approvisionnement créé. »
- **3.4** Laisser la ressource, la provenance ou le tonnage vide → le bouton de création reste désactivé, et la modale dit ce qui manque
- **3.5** Saisir un tonnage négatif ou qui n'est pas un nombre → message « Saisissez un tonnage supérieur ou égal à 0. »
- **3.6** Saisir « 0 », « 1 200,5 » ou « 1200.5 » → le tonnage est accepté

**Fournisseur**

- **3.7** Sans fournisseur, cliquer dans « Fournisseur » → le champ est vide, « Non renseigné » n'y est affiché qu'en indication grisée ; taper une partie d'une dénomination ou d'un SIRET → les fournisseurs correspondants sont proposés, sans option « Non renseigné »
- **3.8** Effacer le fournisseur avec la croix → l'indication « Non renseigné » réapparaît, et la ligne est enregistrée avec « Non renseigné »
- **3.9** Choisir « Ajouter un nouveau fournisseur », puis saisir un SIRET valide → la dénomination est trouvée automatiquement dans l'Annuaire des Entreprises ; « Ajouter le fournisseur » l'ajoute et le sélectionne
- **3.10** Saisir un SIRET incomplet ou avec des lettres → message sur le nombre de chiffres, ou « Le SIRET ne doit contenir que des chiffres. »
- **3.11** Saisir un SIRET déjà utilisé → « Ce SIRET est déjà utilisé par le fournisseur « … ». »
- **3.12** Saisir un SIRET inconnu de l'Annuaire → « Aucun établissement actif trouvé pour ce SIRET. Vérifiez le numéro. »

**Modifier**

- **3.13** Cliquer sur l'icône Modifier → la modale s'ouvre avec les valeurs actuelles de la ligne
- **3.14** Changer un champ, puis « Enregistrer » → la ligne est mise à jour, avec le message « Approvisionnement modifié. »
- **3.15** Corriger un doublon en modifiant une des deux lignes → les deux lignes repassent « Pas de doublon »

**Dupliquer**

- **3.16** Cliquer sur l'icône Dupliquer → une copie de la ligne est créée tout de suite, sans modale, avec le message « Approvisionnement dupliqué. » ; les deux lignes sont marquées en doublon

**Supprimer**

- **3.17** Cliquer sur l'icône Supprimer → la modale « Supprimer cet approvisionnement ? » récapitule la ligne et précise que l'action est définitive
- **3.18** Confirmer → la ligne disparaît du tableau, avec le message « Approvisionnement supprimé. »
- **3.19** Cliquer sur « Annuler » → la ligne reste

##### 4. Synthèse

- **4.1** Ouvrir l'onglet « Synthèse » → titre « Répartition du tonnage du plan », avec deux cartes « Par provenance » et « Par fournisseur »
- **4.2** Regarder une carte → chaque ligne affiche un libellé, une barre, le tonnage en t MV/an et un pourcentage, la plus grosse en premier ; la ligne « Total » fait 100 %
- **4.3** Comparer avec le tableau → le total et les tonnages par provenance et par fournisseur correspondent aux lignes de l'onglet Approvisionnements
- **4.4** Regarder la carte « Par fournisseur » sur un plan où des lignes n'ont pas de fournisseur → leur tonnage est regroupé sous « Non renseigné »
- **4.5** Ouvrir un plan qui n'a qu'une seule ressource → pas de filtre
- **4.6** Ouvrir un plan qui a entre 2 et 6 ressources → « Filtrer par ressource : » propose un bouton par ressource du plan, et seulement celles-là
- **4.7** Cliquer sur une ou plusieurs ressources → les cartes ne comptent plus que ces ressources, et les pourcentages sont recalculés sur ce nouveau total
- **4.8** Cliquer sur « Toutes les ressources » → le filtre est retiré
- **4.9** Ouvrir un plan qui a plus de 6 ressources → le filtre devient une liste déroulante ; chaque ressource choisie s'affiche en dessous, et un clic sur sa croix la retire
- **4.10** Ouvrir l'onglet sur un plan sans approvisionnement → même message que l'onglet Approvisionnements, « Aucun approvisionnement pour ce plan »
