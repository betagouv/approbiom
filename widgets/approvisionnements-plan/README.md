# Widget Approvisionnements d'un plan

## Contexte

### Rappel spécification métier

Un plan est lié à un ou plusieurs approvisionnements.
Un approvisionnement est lié à un plan, un fournisseur, une ressource, une provenance (un département ou un pays étranger) et un tonnage (le tonnage approvisionné).

### Besoin principal

Les agents ont besoin de créer facilement et rapidement des approvisionnements pour un plan choisi.

Cette création de donnée est fastidieuse pour plusieurs raisons :

- Un plan peut avoir plusieurs dizaines approvisionnements.
- Les données demandées (provenance, fournisseur, tonnage...) ne sont pas toujours connues des agents.
- Les données demandées, si elles sont connues, sont souvent éparpillées dans différents documents.

Pour faciliter la création des données des approvisionnements, on décide de créer un custom widget permettant de créer des approvisionnements manuellement ou à partir d'un document.

### Pourquoi les widgets natifs de Grist ne suffisent pas

- Utiliser le widget "formulaire interne" dégrade l'expérience utilisateur.
    - Impossibilité de créer plusieurs approvisionnements à la fois.
    - L'utilisateur doit systématiquement sélectionner le plan à laquelle elles sont liées, au lieu de le faire une seule fois.
    - Sélectionner un plan avec le sélecteur est compliqué.
- La fonctionnalité à intégrer est une fonctionnalité avancée (extraction d'un document et vérification des lignes extraites, vérifications des approvisionnements entrés en regardant la répartition de leur tonnage...).

## Fonctionnalité du widget

### Objectifs principaux

Créer/modifier/supprimer/consulter des lignes dans Approvisionnements à partir d'un plan sélectionné.

Aucune action de vérification supplémentaire en dehors de ce custom widget ne doit être nécessaire pour valider les données des approvisionnements d'un plan.

### Tests E2E

#### Parcours

Je vais sur l’onglet Approvisionnement

- S’il y a des lignes avec les mêmes (fournisseur, provenance, ressource), alors je suis alertée.
- Si j’ai déjà fait des extractions de document, alors je peux les reprendre.

1. Je sélectionne le plan d'approvisiomment

Je souhaite créer des approvisionnements à partir d'un document.

- J'appuie sur Créer des approvisionnements et je choisi l'option à partir d'un document.
- Je choisi le document que je souhaite extraire.
- Je peux consulter, vérifier, modifier les lignes extraites.
- Quand la vérification est terminée, je peux importer les lignes.
- J'importe les lignes
- quand je clique sur "tout importer" ça doit supprimer les lignes à vérifier car elles ne sont plus à vérifiés
- Je les vois apparaître dans l'onglet Approvisionnement d'un plan.

#### Liste des tests

##### 1. Choisir un plan

- **1.1** Ouvrir le widget → titre « Approvisionnements d'un plan » et champ de recherche « Plan d'approvisionnement »
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
- **2.9** Ouvrir un plan sans approvisionnement, mais avec une pièce jointe → « Aucun approvisionnement pour ce plan », avec la proposition d'ajouter par saisie manuelle ou depuis le document
- **2.10** Ouvrir un plan sans approvisionnement ni pièce jointe → seule la saisie manuelle est proposée, et le texte explique pourquoi

##### 3. Ajouter, modifier, dupliquer, supprimer

**Ajouter**

- **3.1** Cliquer sur « Ajouter des approvisionnements » → la modale propose « Saisie manuelle » et « À partir d'un document BCIB/BCIAT »
- **3.2** Ouvrir cette modale sur un plan sans pièce jointe → le choix « À partir d'un document BCIB/BCIAT » est désactivé, avec « Aucune pièce jointe n'est liée à ce plan. »
- **3.3** Choisir « Saisie manuelle », remplir ressource, provenance et tonnage, puis « Créer l'approvisionnement » → la ligne apparaît dans le tableau, avec le message « Approvisionnement créé. »
- **3.4** Laisser la ressource, la provenance ou le tonnage vide → le bouton de création reste désactivé, et la modale dit ce qui manque
- **3.5** Saisir un tonnage négatif ou qui n'est pas un nombre → message « Saisissez un tonnage supérieur ou égal à 0. »
- **3.6** Saisir « 0 », « 1 200,5 » ou « 1200.5 » → le tonnage est accepté

**Fournisseur et pays**

- **3.7** Taper une partie d'une dénomination ou d'un SIRET dans « Fournisseur » → les fournisseurs correspondants sont proposés
- **3.8** Effacer le fournisseur → la ligne est enregistrée avec « Non renseigné »
- **3.9** Choisir « Ajouter un nouveau fournisseur », puis saisir un SIRET valide → la dénomination est trouvée automatiquement dans l'Annuaire des Entreprises ; « Ajouter le fournisseur » l'ajoute et le sélectionne
- **3.10** Saisir un SIRET incomplet ou avec des lettres → message sur le nombre de chiffres, ou « Le SIRET ne doit contenir que des chiffres. »
- **3.11** Saisir un SIRET déjà utilisé → « Ce SIRET est déjà utilisé par le fournisseur « … ». »
- **3.12** Saisir un SIRET inconnu de l'Annuaire → « Aucun établissement actif trouvé pour ce SIRET. Vérifiez le numéro. »
- **3.13** Cliquer sur « Pays absent de la liste ? Créer un pays », puis saisir un nouveau pays → le pays est créé et sélectionné comme provenance
- **3.14** Saisir un pays qui existe déjà, même avec d'autres majuscules ou sans accents → « Ce pays existe déjà : … », avec le bouton « Choisir ce pays »

**Modifier**

- **3.15** Cliquer sur l'icône Modifier → la modale s'ouvre avec les valeurs actuelles de la ligne
- **3.16** Changer un champ, puis « Enregistrer » → la ligne est mise à jour, avec le message « Approvisionnement modifié. »
- **3.17** Corriger un doublon en modifiant une des deux lignes → les deux lignes repassent « Pas de doublon »

**Dupliquer**

- **3.18** Cliquer sur l'icône Dupliquer → une copie de la ligne est créée tout de suite, sans modale, avec le message « Approvisionnement dupliqué. » ; les deux lignes sont marquées en doublon

**Supprimer**

- **3.19** Cliquer sur l'icône Supprimer → la modale « Supprimer cet approvisionnement ? » récapitule la ligne et précise que l'action est définitive
- **3.20** Confirmer → la ligne disparaît du tableau, avec le message « Approvisionnement supprimé. »
- **3.21** Cliquer sur « Annuler » → la ligne reste

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

##### 5. Importer depuis un document

###### 5.1 Choisir et extraire

- **5.1.1** Cliquer sur « Ajouter des approvisionnements », choisir « À partir d'un document BCIB/BCIAT », puis « Continuer » → écran « Ajouter des approvisionnements depuis un document BCIB/BCIAT » ; l'en-tête du plan reste affiché, mais sans « Changer de plan »
- **5.1.2** Regarder la liste des documents → seules les pièces jointes du plan sont proposées, avec leur nom, leur taille et leur type
- **5.1.3** Cliquer sur « Retour aux approvisionnements du plan » → retour à la page du plan
- **5.1.4** Choisir un document jamais extrait → la carte est cochée, avec « Document sélectionné : … », et le bouton « Extraire les données » devient actif
- **5.1.5** Cliquer sur « Extraire les données » → « Extraction en cours » s'affiche, puis l'écran de vérification
- **5.1.6** Regarder la table des lignes extraites dans Grist → une ligne par ligne du document, en « Non vérifiée »
- **5.1.7** Revenir au choix des documents → le document extrait affiche « Vérification en cours · x/y »
- **5.1.8** Choisir un document déjà extrait → les boutons deviennent « Reprendre la vérification » et « Relancer l'extraction »
- **5.1.9** Cliquer sur « Relancer l'extraction », puis confirmer → les lignes et leur vérification sont remplacées par une nouvelle extraction, toutes en « Non vérifiée » ; les approvisionnements déjà importés ne changent pas

###### 5.2 Vérifier les lignes

- **5.2.1** Regarder l'écran de vérification → le nom du document, cliquable pour le télécharger, un badge « N lignes extraites le … » et « x sur y vérifiées »
- **5.2.2** Regarder le tableau → colonnes Contrôle, Ligne, Fournisseur, Ressource, Tonnage total (t MV/an), Répartition par provenance, Action ; chaque ligne a un interrupteur dans Contrôle et un bouton « Modifier »
- **5.2.3** Déplier la répartition d'une ligne → le détail de chaque provenance, avec son pourcentage
- **5.2.4** Regarder une ligne dont la répartition ne fait pas 100 % → badge « Total X % ≠ 100 % »
- **5.2.5** Tant qu'il reste des lignes non vérifiées → pas de bouton d'import, et la phrase « Vérifiez toutes les lignes pour pouvoir les importer (x/y). »
- **5.2.6** Activer l'interrupteur d'une ligne → elle passe en « Vérifiée » ; le désactiver → elle repasse en « Non vérifiée »
- **5.2.7** Regarder une ligne sans ressource ou sans provenance → son interrupteur est désactivé, avec « Ressource ou provenance manquante »
- **5.2.8** Cliquer sur « Modifier » → modale « Données retenues dans la ligne N », avec le fournisseur, la ressource et la répartition par provenance
- **5.2.9** Regarder la ressource → « Correspondance trouvée » si le document a été reconnu, sinon « Aucune correspondance trouvée »
- **5.2.10** Saisir un pourcentage → le tonnage de la provenance se recalcule ; saisir un tonnage → le pourcentage se recalcule
- **5.2.11** Ajouter puis supprimer une provenance → la répartition se met à jour
- **5.2.12** Faire une répartition qui ne fait pas 100 % → « La répartition ne fait pas 100 %. », mais l'enregistrement reste possible
- **5.2.13** Changer le fournisseur, la ressource ou un pourcentage, puis cliquer sur « Annuler » → rien n'est enregistré
- **5.2.14** Changer le fournisseur, la ressource ou un pourcentage, puis cliquer sur « Modifier » → la modale se ferme et les changements sont enregistrés ; le bouton « Modifier » n'est jamais grisé pendant la saisie
- **5.2.15** Enregistrer une modification sur une ligne vérifiée → elle repasse en « Non vérifiée » et doit être vérifiée de nouveau avec l'interrupteur

###### 5.3 Importer

- **5.3.1** Vérifier toutes les lignes → le bouton « Importer les N lignes vérifiées » apparaît
- **5.3.2** Cliquer dessus → modale « Importer les lignes vérifiées ? », avec « Attention : N lignes du document vont créer M approvisionnements dans la table Approvisionnement de ce plan. »
- **5.3.3** Confirmer → retour à la page du plan, avec le message « M approvisionnements importés depuis N lignes du document. »
- **5.3.4** Regarder le tableau du plan → un approvisionnement par provenance de chaque ligne, avec un tonnage égal au tonnage de la ligne multiplié par le pourcentage
- **5.3.5** Regarder la table Approvisionnement dans Grist → les nouvelles lignes ont la pièce jointe en source et les données additionnelles du document
- **5.3.6** Regarder la table des lignes extraites dans Grist → les lignes importées ont disparu
- **5.3.7** Revenir au choix des documents → le document n'affiche plus « Vérification en cours », et « Extraire les données » est de nouveau proposé
- **5.3.8** Importer des lignes identiques à des approvisionnements existants → l'import n'est pas bloqué, et le tableau du plan marque les doublons

###### 5.4 Reprendre une extraction en cours

- **5.4.1** Extraire un document, vérifier une partie des lignes, puis revenir au plan → en haut de l'onglet Approvisionnements, un bandeau « Extraction en cours » affiche le document, « x/y lignes vérifiées · extraite le … » et le bouton « Reprendre la vérification »
- **5.4.2** Avoir deux documents en cours sur le même plan → le titre devient « 2 extractions en cours », avec une ligne par document
- **5.4.3** Cliquer sur « Reprendre la vérification » → ouverture directe de la vérification de ce document, avec « Reprise de l'extraction du … · x/y lignes déjà vérifiées » ; les lignes déjà vérifiées le sont toujours
- **5.4.4** Recharger la page Grist au milieu d'une vérification → la reprise retrouve les lignes et leur vérification
- **5.4.5** Ouvrir un plan dont aucun document n'est en cours, ou dont tout a été importé → pas de bandeau
- **5.4.6** Afficher le widget dans un panneau étroit → le bouton « Reprendre la vérification » passe sous le texte
