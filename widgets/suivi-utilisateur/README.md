# Widget Suivi utilisateur

## Contexte

L'équipe produit veut suivre l'usage d'Approbiom par ses utilisateurs. Pour l'instant, seule la création de plans d'approvisionnement est suivie.

Grist enregistre, pour chaque plan, qui l'a créé et quand : colonnes « Créé par » (`Cree_par`) et « Créé le » (`Cree_le`) de la table `Plan_d_approvisionnement`. « Créé par » contient l'email du compte Grist (formule d'initialisation `user.Email`). Ce suivi a commencé en octobre 2026 : les plans plus anciens n'ont aucune valeur dans ces colonnes et ne sont pas comptés.

Les utilisateurs sont les comptes de la table `Utilisateur` dont la case « Utilisateur Approbiom » (`Utilisateur_Approbiom`) est cochée. Les autres comptes, comme ceux des administrateurs ou les comptes de service, ne sont pas suivis.

## Fonctionnalité du widget

Le widget affiche :

- le total des plans créés par les utilisateurs depuis le début du suivi ;
- la part des utilisateurs qui ont créé au moins un plan, en pourcentage et en barre ;
- le nombre de plans créés par utilisateur et par semaine : une ligne par utilisateur et par semaine où il a créé au moins un plan, la semaine la plus récente en premier.

Un plan est compté quand l'email de « Créé par » est celui d'un utilisateur dans la table `Utilisateur`, sans tenir compte des majuscules. Le nombre total d'utilisateurs est le nombre d'emails différents parmi les comptes cochés ; un compte coché sans email n'est pas compté.

Une semaine va du lundi au dimanche, à l'heure de Paris : ce sont les mêmes semaines que la colonne « Crée la semaine » du document. Une semaine sans aucune création n'a pas de ligne.

Le widget n'a pas de configuration. Il demande l'« Accès complet au document », pour lire les tables `Plan_d_approvisionnement` et `Utilisateur`.

### Tests E2E

#### Liste des tests

- **1.1** Ouvrir le widget → titre « Suivi des interactions utilisateur », deux indicateurs « Plans créés » et « Utilisateurs ayant créé un plan », puis le tableau « Plans créés par utilisateur et par semaine »
- **1.2** Regarder « Plans créés » → le nombre de plans dont « Créé le » est renseigné et dont « Créé par » est l'email d'un compte coché « Utilisateur Approbiom », et la date de la première de ces créations
- **1.3** Regarder « Utilisateurs ayant créé un plan » → le pourcentage, une barre remplie d'autant, et « N utilisateurs sur M », M étant le nombre de comptes cochés « Utilisateur Approbiom » dans la table `Utilisateur`
- **1.4** Regarder le tableau → colonnes « Semaine du », « Utilisateur », « Plans créés » ; une ligne par utilisateur et par semaine, la semaine la plus récente en premier ; les comptes correspondent, pour ces utilisateurs, à la table récapitulative `Plan_d_approvisionnement_summary_Cree_la_semaine_Cree_par`
- **1.5** Créer un plan avec un compte coché « Utilisateur Approbiom », puis recharger le widget → il est compté sur la ligne de la semaine en cours et de ce compte, en haut du tableau
- **1.6** Créer un plan avec un compte non coché, comme un administrateur, puis recharger le widget → rien ne change
- **1.7** Cocher « Utilisateur Approbiom » pour ce compte, puis recharger le widget → son plan est compté, et le nombre total d'utilisateurs augmente de 1
- **1.8** Décocher « Utilisateur Approbiom » pour tous les comptes, puis recharger le widget → l'indicateur affiche « Aucun utilisateur », et le tableau « aucun utilisateur n'a créé de plan depuis le début du suivi »
