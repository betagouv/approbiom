# Widget Suivi utilisateur

## Contexte

L'équipe produit veut suivre l'usage d'Approbiom par ses utilisateurs. Pour l'instant, seule la création de plans d'approvisionnement est suivie.

Grist enregistre, pour chaque plan, qui l'a créé et quand : colonnes « Créé par » (`Cree_par`) et « Créé le » (`Cree_le`) de la table `Plan_d_approvisionnement`. « Créé par » contient l'email du compte Grist (formule d'initialisation `user.Email`). Ce suivi a commencé en octobre 2026 : les plans plus anciens n'ont aucune valeur dans ces colonnes et ne sont pas comptés. Le widget compte à partir du lundi 5 octobre 2026, premier lundi du mois ; un plan daté d'avant, à la main, n'est pas compté non plus.

Les utilisateurs sont les comptes de la table `Utilisateur` dont la case « Utilisateur Approbiom » (`Utilisateur_Approbiom`) est cochée. Les autres comptes, comme ceux des administrateurs ou les comptes de service, ne sont pas suivis.

## Fonctionnalité du widget

Le widget affiche :

- depuis le début du suivi, deux indicateurs : le total des plans créés par les utilisateurs, avec la date de la première création, et la part des utilisateurs qui ont créé au moins un plan, en pourcentage et en barre (« N utilisateurs sur M ») ;
- en dessous, dans un cadre, le nombre d'utilisateurs qui ont créé au moins un plan cette semaine ;
- à côté, un graphique en barres : pour chaque semaine, le nombre d'utilisateurs qui ont créé au moins un plan, de la première création à la semaine en cours, donc au plus tôt à partir d'octobre 2026. Une semaine sans création a sa barre, à 0. Les mêmes chiffres sont donnés aux lecteurs d'écran dans un tableau masqué ;
- le nombre de plans créés par utilisateur et par semaine : une ligne par utilisateur et par semaine où il a créé au moins un plan, la semaine la plus récente en premier.

Un plan est compté quand l'email de « Créé par » est celui d'un utilisateur dans la table `Utilisateur`, sans tenir compte des majuscules. Un utilisateur compte une fois par semaine, quel que soit le nombre de plans qu'il y a créés. Le nombre total d'utilisateurs, base de la part et rappelé sous le chiffre de la semaine, est le nombre d'emails différents parmi les comptes cochés ; un compte coché sans email n'est pas compté.

Une semaine va du lundi au dimanche, à l'heure de Paris : ce sont les mêmes semaines que la colonne « Crée la semaine » du document. Dans le tableau, une semaine sans aucune création n'a pas de ligne.

Le widget n'a pas de configuration. Il demande l'« Accès complet au document », pour lire les tables `Plan_d_approvisionnement` et `Utilisateur`.

### Tests E2E

#### Liste des tests

- **1.1** Ouvrir le widget → titre « Suivi des interactions utilisateur », les indicateurs « Plans créés » et « Utilisateurs ayant créé un plan depuis le début du suivi », puis un cadre avec « Utilisateurs ayant créé un plan cette semaine » à gauche et le graphique « Utilisateurs ayant créé un plan, par semaine » à droite (l'un sous l'autre dans un panneau étroit), puis le tableau « Plans créés par utilisateur et par semaine »
- **1.2** Regarder « Plans créés » → le nombre de plans des comptes cochés « Utilisateur Approbiom » créés depuis le 5 octobre 2026, et « Depuis le … » avec la date de la première de ces créations
- **1.3** Regarder « Utilisateurs ayant créé un plan depuis le début du suivi » → le pourcentage, une barre remplie d'autant, et « N utilisateurs sur M », M étant le nombre de comptes cochés « Utilisateur Approbiom », comme le dit la note de la tuile
- **1.4** Regarder le chiffre de la semaine → le nombre d'utilisateurs différents qui ont créé au moins un plan depuis lundi, « Semaine du … » avec la date du lundi, et « Sur M utilisateurs. »
- **1.5** Regarder le graphique → une barre par semaine, de la semaine de la première création (jamais avant le 5 octobre 2026) à la semaine en cours, la plus ancienne à gauche ; sous chaque barre, la date du lundi (« 12 oct. ») ; au-dessus, le nombre d'utilisateurs ; la plus haute barre va jusqu'en haut, les autres en proportion ; une semaine sans création a une barre à 0
- **1.6** Comparer avec la table récapitulative `Plan_d_approvisionnement_summary_Cree_la_semaine_Cree_par` → pour chaque semaine, la barre compte les lignes des comptes cochés « Utilisateur Approbiom » ; le tableau du widget donne leurs plans
- **1.7** Créer un plan avec un compte coché « Utilisateur Approbiom » qui n'en a pas encore créé cette semaine, puis recharger le widget → « Plans créés », le chiffre de la semaine et la dernière barre augmentent de 1, et la part aussi si le compte n'avait encore rien créé ; un deuxième plan du même compte augmente « Plans créés » de 1, sans changer le chiffre de la semaine ni la dernière barre
- **1.8** Créer un plan avec un compte non coché, comme un administrateur, puis recharger le widget → rien ne change
- **1.9** Cocher « Utilisateur Approbiom » pour ce compte, puis recharger le widget → son plan est compté, et le nombre de comptes cochés augmente de 1, ce qui change la part des utilisateurs
- **1.10** Avec un lecteur d'écran → le graphique n'est pas lu, mais un tableau « Utilisateurs ayant créé un plan, par semaine » donne chaque semaine et son nombre d'utilisateurs
- **1.11** Décocher « Utilisateur Approbiom » pour tous les comptes, puis recharger le widget → « Aucun utilisateur » et « Aucun compte n'est coché… » dans l'indicateur de la part, 0 cette semaine sans autre note, « Aucun utilisateur n'a encore créé de plan. » à la place du graphique, et le tableau « aucun utilisateur n'a créé de plan depuis le début du suivi »
