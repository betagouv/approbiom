# Widget Suivi utilisateur

## Contexte

L'équipe produit veut suivre l'usage d'Approbiom par ses utilisateurs. Pour l'instant, seule la création de plans d'approvisionnement est suivie.

Grist enregistre, pour chaque plan, qui l'a créé et quand : colonnes « Créé par » (`Cree_par`) et « Créé le » (`Cree_le`) de la table `Plan_d_approvisionnement`. Ce suivi a commencé en octobre 2026 : les plans plus anciens n'ont aucune valeur dans ces colonnes et ne sont pas comptés.

## Fonctionnalité du widget

Le widget affiche :

- le total des plans créés depuis le début du suivi ;
- la part des utilisateurs qui ont créé au moins un plan, sur le nombre total d'utilisateurs, en pourcentage et en barre ;
- le nombre de plans créés par utilisateur et par semaine : une ligne par utilisateur et par semaine où il a créé au moins un plan, la semaine la plus récente en premier.

Une semaine va du lundi au dimanche, à l'heure de Paris : ce sont les mêmes semaines que la colonne « Crée la semaine » du document. Une semaine sans aucune création n'a pas de ligne.

### Configuration

Le nombre total d'utilisateurs ne vient pas du document : il se renseigne dans la configuration du widget.

1. Sélectionner le widget, puis ouvrir le panneau de droite (« Widget personnalisé »).
2. Cliquer sur « Ouvrir la configuration ».
3. Saisir le nombre total d'utilisateurs, puis « Appliquer ».
4. Cliquer sur « Enregistrer », en haut du widget. Grist garde sinon la valeur en brouillon, comme un tri ou un filtre, et l'oublie au rechargement.

Le widget demande l'« Accès complet au document ».

### Tests E2E

#### Liste des tests

- **1.1** Ouvrir le widget → titre « Suivi des interactions utilisateur », deux indicateurs « Plans créés » et « Utilisateurs ayant créé un plan », puis le tableau « Plans créés par utilisateur et par semaine »
- **1.2** Regarder « Plans créés » → le nombre de plans dont « Créé le » est renseigné, et la date de la première création suivie
- **1.3** Regarder le tableau → colonnes « Semaine du », « Utilisateur », « Plans créés » ; une ligne par utilisateur et par semaine, la semaine la plus récente en premier ; les comptes correspondent à la table récapitulative `Plan_d_approvisionnement_summary_Cree_la_semaine_Cree_par`
- **1.4** Créer un plan, puis recharger le widget → il est compté sur la ligne de la semaine en cours et de l'utilisateur connecté, en haut du tableau
- **2.1** Sans configuration → l'indicateur « Utilisateurs ayant créé un plan » affiche « Non configuré » et indique où renseigner le nombre total d'utilisateurs
- **2.2** Cliquer sur « Ouvrir la configuration » dans le panneau de droite → le formulaire « Configuration du widget » remplace le tableau
- **2.3** Saisir « 0 », « -2 », « 2,5 » ou rien, puis « Appliquer » → « Saisissez un nombre entier supérieur à 0. »
- **2.4** Saisir un nombre valide, puis « Appliquer » → le formulaire se ferme ; l'indicateur affiche le pourcentage, une barre remplie d'autant, « N utilisateurs sur M » et rappelle que le nombre total est saisi à la main dans la configuration du widget ; Grist affiche « Enregistrer » en haut du widget
- **2.5** Cliquer sur « Enregistrer » en haut du widget, puis recharger la page → le nombre total d'utilisateurs est conservé
- **2.6** Appliquer un autre nombre, puis cliquer sur l'icône d'annulation à côté de « Enregistrer » → l'indicateur revient au nombre enregistré
- **2.7** Ouvrir la configuration, puis « Annuler » → retour au tableau sans changement
