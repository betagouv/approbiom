# Widget Importer des approvisionnements depuis un document

## Contexte

### Rappel spécification métier

Un plan est lié à un ou plusieurs approvisionnements.
Un approvisionnement est lié à un plan, un fournisseur, une ressource, une provenance (un département ou un pays étranger) et un tonnage (le tonnage approvisionné).

Les porteurs de projet décrivent leur approvisionnement dans des documents, par exemple un document fourni par l'ADEME pour les appels à projet BCIB/BCIAT.

### Besoin principal

Les agents ont besoin de créer facilement et rapidement les approvisionnements d'un plan à partir du document BCIB/BCIAT qui y est joint.

Saisir ces approvisionnements à la main est fastidieux :

- Un plan peut avoir plusieurs dizaines d'approvisionnements.
- Chaque ligne du document se répartit sur plusieurs provenances, donc donne plusieurs approvisionnements.
- Les provenances sont écrites en texte libre (« Corrèze 40 %, Creuse 60 % ») et doivent être converties en départements ou en pays.

Ce widget extrait les lignes du document, les fait vérifier par l'agent, puis crée les approvisionnements correspondants.

La saisie manuelle, la consultation et la modification des approvisionnements d'un plan se font dans le widget `approvisionnements-saisie-manuelle`.

### Pourquoi les widgets natifs de Grist ne suffisent pas

- Grist ne sait pas lire un tableur joint en pièce jointe ni en extraire des lignes.
- La fonctionnalité est avancée : extraction d'un document, rapprochement avec les fournisseurs et les ressources connus, lecture des provenances, vérification ligne par ligne avant l'import.
- Sélectionner un plan avec le sélecteur natif est compliqué.
- On veut des données propres en entrée : un siret qui soit dans l'annuaire des entreprise, une ressource qui soit dans notre référentiel de ressources, une provenance non nulle... Le formulaire natif de Grist ne nous permet pas cette précision.

## Fonctionnalité du widget

### Objectifs principaux

Créer des lignes dans Approvisionnements à partir d'un document (aujourd'hui BCIB/BCIAT) joint au plan sélectionné.

Aucune action de vérification supplémentaire en dehors de ce custom widget ne doit être nécessaire pour valider les lignes importées.

### Tests E2E

#### Parcours

1. Dans l'onglet « 1. Sélection du document », je cherche le plan d'approvisionnement : son résumé et la liste de ses documents s'affichent. Je vois quels documents ont déjà été importés, et lesquels ont une extraction en cours, que je peux reprendre.
2. Je choisis le document et je lance l'extraction : l'onglet « 2. Extraction » s'ouvre.
3. À la fin de l'extraction, l'onglet « 3. Vérification et import » s'ouvre : je consulte, vérifie et modifie les lignes extraites.
4. Quand toutes les lignes sont vérifiées, je les importe.
5. Les approvisionnements sont créés dans la table Approvisionnement, avec le document en source, et les lignes importées sont supprimées de la table temporaire des lignes extraites. Je reviens sur l'onglet 1, où le document apparaît comme déjà importé.

#### Liste des tests

##### 1. Choisir un plan

- **1.1** Ouvrir le widget → titre « Importer des approvisionnements depuis un document », onglets « 1. Sélection du document », « 2. Extraction » et « 3. Vérification et import » ; seul le premier est actif, avec le champ de recherche « Plan d'approvisionnement » et « Choisissez un plan pour afficher ses pièces jointes. »
- **1.2** Taper une partie du nom d'un plan, sans tenir compte des majuscules ni des accents (« hopital » trouve « Hôpital ») → la liste ne propose que les plans dont le nom contient ce texte
- **1.3** Taper un texte qui ne correspond à aucun plan → aucun plan proposé
- **1.4** Choisir un plan → son nom, son type, son appel à projet et son statut s'affichent sous la recherche, suivis de la liste de ses documents
- **1.5** Choisir un autre plan dans la recherche → le résumé et la liste des documents changent, et aucun document n'est sélectionné

##### 2. Choisir et extraire un document

- **2.1** Regarder la liste des documents → seules les pièces jointes du plan sont proposées, avec leur nom, leur taille et leur type
- **2.2** Ouvrir un plan sans pièce jointe → « Aucune pièce jointe n'est liée à ce plan »
- **2.3** Choisir un document jamais extrait → la carte est cochée, avec « Document sélectionné : … », et le bouton « Extraire les données » devient actif
- **2.4** Cliquer sur « Extraire les données » → l'onglet « 2. Extraction » s'ouvre avec « Extraction en cours », puis l'onglet « 3. Vérification et import »
- **2.5** Extraire un document qui n'est pas un tableur BCIB/BCIAT → « L'extraction a échoué », avec le message d'erreur, la structure attendue du document (feuille « Fournisseurs », « fournisseur » ou « client » en colonne A, colonnes Sous catégorie ou Nature combustible, Tonnage et Répartition approximative, tableau arrêté à la ligne TOTAL), « Recommencer l'extraction » et « Choisir un autre document »
- **2.6** Regarder la table des lignes extraites dans Grist → une ligne par ligne du document, en « Non vérifiée »
- **2.7** Revenir sur l'onglet 1 → le document extrait affiche « Vérification en cours · x/y »
- **2.8** Choisir un document déjà extrait → les boutons deviennent « Reprendre la vérification » et « Relancer l'extraction »
- **2.9** Cliquer sur « Relancer l'extraction », puis confirmer → les lignes et leur vérification sont remplacées par une nouvelle extraction, toutes en « Non vérifiée » ; les approvisionnements déjà importés ne changent pas
- **2.10** Regarder un document dont des approvisionnements ont été importés → sa carte affiche « Déjà importé · N approvisionnements », où N est le nombre de lignes de la table Approvisionnement qui ont ce document en source
- **2.11** Relancer l'extraction d'un document déjà importé → sa carte affiche les deux badges, « Déjà importé · N approvisionnements » et « Vérification en cours · x/y »

##### 3. Vérifier les lignes

- **3.1** Regarder l'écran de vérification → le nom du document, cliquable pour le télécharger, un badge « N lignes extraites le … » et « x sur y vérifiées »
- **3.2** Regarder le tableau → colonnes Contrôle, Ligne, Fournisseur, Ressource, Tonnage total (t MV/an), Répartition par provenance, Action ; chaque ligne a un interrupteur dans Contrôle et un bouton « Modifier »
- **3.3** Déplier la répartition d'une ligne → le détail de chaque provenance, avec son pourcentage
- **3.4** Regarder une ligne dont la répartition ne fait pas 100 % → badge « Total X % ≠ 100 % »
- **3.5** Tant qu'il reste des lignes non vérifiées → pas de bouton d'import, et la phrase « Vérifiez toutes les lignes pour pouvoir les importer (x/y). »
- **3.6** Activer l'interrupteur d'une ligne → elle passe en « Vérifiée » ; le désactiver → elle repasse en « Non vérifiée »
- **3.7** Regarder une ligne sans ressource ou sans provenance → son interrupteur est désactivé, avec « Ressource ou provenance manquante »
- **3.8** Cliquer sur « Modifier » → modale « Données retenues dans la ligne N », avec le fournisseur, la ressource, la répartition par provenance et un avertissement toujours affiché : si le document ne donne pas de provenance, il faut indiquer le département de l'installation
- **3.9** Regarder la ressource → « Correspondance trouvée » si le document a été reconnu, sinon « Aucune correspondance trouvée »
- **3.10** Saisir un pourcentage → le tonnage de la provenance se recalcule ; saisir un tonnage → le pourcentage se recalcule
- **3.11** Ajouter puis supprimer une provenance → la répartition se met à jour
- **3.12** Faire une répartition qui ne fait pas 100 % → « La répartition ne fait pas 100 %. », mais l'enregistrement reste possible
- **3.13** Changer le fournisseur, la ressource ou un pourcentage, puis cliquer sur « Annuler » → rien n'est enregistré
- **3.14** Changer le fournisseur, la ressource ou un pourcentage, puis cliquer sur « Modifier » → la modale se ferme, les changements sont enregistrés et la ligne passe en « Vérifiée » ; le bouton « Modifier » n'est jamais grisé pendant la saisie
- **3.15** Cliquer sur « Modifier » en laissant la ligne sans ressource ou sans provenance → les changements sont enregistrés, mais la ligne reste « Non vérifiée », avec « Ressource ou provenance manquante »

**Fournisseur et provenance**

- **3.16** Taper une partie d'une dénomination ou d'un SIRET dans « Fournisseur » → les fournisseurs correspondants sont proposés
- **3.17** Choisir « Ajouter un nouveau fournisseur », puis saisir un SIRET valide → la dénomination est trouvée automatiquement dans l'Annuaire des Entreprises ; « Ajouter le fournisseur » l'ajoute et le sélectionne
- **3.18** Saisir un SIRET incomplet, avec des lettres, déjà utilisé ou inconnu de l'Annuaire → le message correspondant s'affiche, et le fournisseur n'est pas ajouté
- **3.19** Ajouter une provenance → la liste propose les départements et les pays étrangers déjà connus du document ; le widget ne permet pas de créer un pays

##### 4. Importer

- **4.1** Vérifier toutes les lignes → le bouton « Importer les N lignes vérifiées » apparaît
- **4.2** Confirmer → retour sur l'onglet « 1. Sélection du document », avec le message « M approvisionnements importés depuis N lignes du document. »
- **4.3** Regarder la table Approvisionnement dans Grist → un approvisionnement par provenance de chaque ligne, avec un tonnage égal au tonnage de la ligne multiplié par le pourcentage ; chaque approvisionnement a la pièce jointe en source et les données additionnelles du document
- **4.4** Regarder la table temporaire des lignes extraites dans Grist → les lignes importées en ont été supprimées
- **4.5** Regarder la carte du document dans l'onglet 1 → elle affiche « Déjà importé · M approvisionnements » et plus « Vérification en cours » ; « Extraire les données » est de nouveau proposé
- **4.6** Importer des lignes identiques à des approvisionnements existants → l'import n'est pas bloqué ; les doublons se corrigent dans le widget `approvisionnements-saisie-manuelle`

##### 5. Reprendre une extraction en cours

- **5.1** Extraire un document, vérifier une partie des lignes, puis revenir sur l'onglet 1 → le document affiche « Vérification en cours · x/y »
- **5.2** Avoir deux documents en cours sur le même plan → chacun affiche son propre « Vérification en cours · x/y »
- **5.3** Choisir le document en cours, puis « Reprendre la vérification » → ouverture de la vérification de ce document, avec « Reprise de l'extraction du … · vérification en cours » ; les lignes déjà vérifiées le sont toujours
- **5.4** Recharger la page Grist au milieu d'une vérification, puis rechoisir le même plan → le document est toujours « Vérification en cours », et la reprise retrouve les lignes et leur vérification
- **5.5** Ouvrir un plan dont aucun document n'est en cours, ou dont tout a été importé → aucun document n'affiche « Vérification en cours »

##### 6. Naviguer entre les étapes

- **6.1** Tant qu'aucune extraction n'est lancée → les onglets « 2. Extraction » et « 3. Vérification et import » sont inactifs
- **6.2** Cliquer sur « Reprendre la vérification » → l'onglet 2 s'ouvre le temps de relire les lignes, puis l'onglet 3
- **6.3** Pendant la vérification, cliquer sur l'onglet 1 → retour à la liste des documents ; l'onglet 3 reste cliquable et ramène à la vérification, sans nouvelle extraction
- **6.4** Choisir un autre document ou un autre plan dans l'onglet 1 → les onglets 2 et 3 redeviennent inactifs
- **6.5** Importer les lignes → retour sur l'onglet 1, et les onglets 2 et 3 redeviennent inactifs
- **6.6** Faire échouer une extraction → l'onglet 2 affiche l'échec et l'onglet 3 reste inactif ; « Choisir un autre document » ramène sur l'onglet 1
