# Tests E2E — widget Import ADEME

Scénarios de bout en bout du widget `widgets/import-ademe`, qui importe un
document ADEME BCIB/BCIAT (Excel) dans la table `Approvisionnement`.

Chaque scénario a un identifiant, des préconditions, des étapes et un résultat
attendu. Les libellés cités entre guillemets sont ceux affichés à l'écran.

## Environnement

- Grist local et document de développement décrits dans
  [la note du document Grist local](../notes/2026-09-27-document-grist-local-import-ademe.md).
- Widget servi par Vite (`pnpm run dev`), affiché dans la page « Import ADEME ».
- Les scénarios qui modifient les données (import, création de fournisseur ou
  de pays) se jouent sur le document local, jamais sur la production.

### Jeux de données à préparer

| Nom          | Description                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `PLAN_VIDE`  | un plan sans aucun approvisionnement, avec au moins un document « excel ademe » jamais extrait                                   |
| `PLAN_PLEIN` | un plan avec au moins un approvisionnement, avec un document déjà extrait dont une partie seulement des lignes est déjà présente |
| `DOC_OK`     | un document ADEME valide (feuille « Fournisseurs », en-tête en colonne A)                                                        |
| `DOC_KO`     | un document joint au plan qui n'est pas un document ADEME valide (par exemple un `.xlsx` sans feuille « Fournisseurs »)          |
| `LIGNE_SANS` | une ligne de `DOC_OK` dont le fournisseur n'existe pas dans `Entreprise`, et dont la répartition cite un pays absent de la liste |

Pour vérifier les tables, ouvrir les pages Grist `Approvisionnement` et
`Approvisionnement_extrait_d_un_document`, ou interroger l'API du document
(`/sql?q=…`).

---

## 1. Sélection du document

### 1.0 Parcours de base

**E2E-1.0.1 — Rechercher et choisir un plan**

- Étapes :
    1. Ouvrir la page « Import ADEME ».
    2. Taper une partie du nom d'un plan dans « Plan d'approvisionnement ».
    3. Choisir le plan dans la liste proposée.
- Attendu :
    - Avant le choix : « Choisissez un plan pour afficher ses pièces jointes. »
      et le pied indique « Aucun plan sélectionné. ».
    - Après le choix : la carte du plan affiche Nom, Type de plan, Appel à
      projet, Statut.
    - La section « Pièces jointes du plan » liste les documents du plan, avec
      « N documents · sélectionnez le document ADEME ».
    - Le bouton « Extraire les données » reste désactivé ; le pied indique
      « Sélectionnez le document ADEME. ».

**E2E-1.0.2 — Choisir un document**

- Étapes : cliquer sur la carte d'un document.
- Attendu :
    - La carte est cochée (icône de validation, `aria-pressed="true"`).
    - Le pied indique « Document sélectionné : <nom du fichier> ».
    - « Extraire les données » devient actif.

**E2E-1.0.3 — Plan sans pièce jointe**

- Étapes : choisir un plan sans document.
- Attendu : « Aucune pièce jointe n'est liée à ce plan. » ; « Extraire les
  données » reste désactivé.

**E2E-1.0.4 — Changer de plan**

- Étapes : choisir un document, puis choisir un autre plan.
- Attendu : plus aucun document n'est sélectionné ; les onglets 2 et 3 sont
  désactivés.

### 1.1 Lignes déjà présentes ou non (état d'extraction des documents)

**E2E-1.1.1 — Document jamais extrait**

- Préconditions : `PLAN_VIDE`, document jamais extrait.
- Attendu : sur la carte du document, le badge gris « Pas encore extrait »,
  sans décompte de lignes.

**E2E-1.1.2 — Document extrait, aucune ligne déjà présente**

- Préconditions : un document extrait dont aucune ligne n'est déjà présente
  dans `Approvisionnement`.
- Attendu : badge bleu « Extrait le JJ/MM/AAAA » (date de
  `Date_d_extraction`) et, dessous, « Déjà présentes : 0 ligne sur N ».
- La carte indique aussi la taille et le type de la pièce jointe (« excel
  ademe », ou « type non renseigné »).

**E2E-1.1.3 — Document extrait, lignes en partie déjà présentes**

- Préconditions : `PLAN_PLEIN`.
- Attendu : badge « Extrait le JJ/MM/AAAA » et « Déjà présentes : X lignes
  sur N », X étant le nombre de lignes dont `Etat` vaut « Créés » dans
  `Approvisionnement_extrait_d_un_document`.
- Vérifier l'accord : « Déjà présentes : 1 ligne sur N », « … 2 lignes sur N ».

**E2E-1.1.4 — Le décompte suit les créations**

- Étapes :
    1. Noter le décompte d'un document.
    2. Importer une ligne de ce document (voir 3.2).
    3. Revenir sur l'onglet « 1. Sélection du document ».
- Attendu : le décompte a augmenté, sans recharger la page.

### 1.2 Approvisionnements déjà liés au plan ou non

**E2E-1.2.1 — Plan sans approvisionnement**

- Préconditions : `PLAN_VIDE`.
- Attendu : aucune alerte sous la carte du plan.

**E2E-1.2.2 — Plan avec approvisionnements**

- Préconditions : `PLAN_PLEIN`, avec N approvisionnements dans
  `Approvisionnement`, qu'ils viennent d'un document ou d'une saisie manuelle.
- Attendu : sous la carte du plan, une alerte DSFR « warning » :
    - titre « N approvisionnements sont déjà liés à ce plan » (au singulier :
      « 1 approvisionnement est déjà lié à ce plan ») ;
    - texte « Vérifiez qu'ils ne font pas doublon avec ceux du document avant
      d'importer. ».
- N est égal au nombre de lignes de `Approvisionnement` dont
  `Plan_d_approvisionnement` est ce plan.

**E2E-1.2.3 — L'alerte apparaît après un premier import**

- Préconditions : `PLAN_VIDE`.
- Étapes : extraire un document, importer une ligne, revenir à l'onglet 1.
- Attendu : l'alerte est maintenant affichée avec le nombre d'approvisionnements
  créés.

---

## 2. Extraction

**E2E-2.0.1 — Lancer l'extraction**

- Étapes : choisir un document, cliquer sur « Extraire les données ».
- Attendu :
    - L'onglet « 2. Extraction » s'ouvre ; le contexte affiche « Plan : … » et
      « Document : … ».
    - Pendant le traitement : « Extraction en cours… » avec la barre de
      progression.

### 2.1 Avec et sans message d'erreur

**E2E-2.1.1 — Extraction réussie d'un document jamais extrait**

- Préconditions : `DOC_OK`, jamais extrait.
- Attendu :
    - Le widget passe à l'onglet « 3. Vérification et import ».
    - `Approvisionnement_extrait_d_un_document` contient une ligne par ligne de
      la feuille « Fournisseurs », avec `Document`, `Plan_d_approvisionnement`,
      `Ligne_Excel`, `Date_d_extraction` et les colonnes `Document_*` remplies.
    - Chaque ligne est créée une seule fois (pas de doublon, même en mode
      développement).

**E2E-2.1.2 — Document déjà extrait**

- Préconditions : un document déjà extrait.
- Étapes : le sélectionner et cliquer sur « Extraire les données ».
- Attendu :
    - Les lignes sont relues depuis la table, le document n'est pas extrait de
      nouveau : aucune nouvelle ligne dans la table.
    - Les modifications faites auparavant (fournisseur, ressource, répartition)
      sont conservées.
    - La date affichée est celle de la première extraction.

**E2E-2.1.3 — Document invalide**

- Préconditions : `DOC_KO`.
- Attendu :
    - Alerte d'erreur « L'extraction a échoué » avec le message technique, par
      exemple « Un problème est survenu : la feuille « Fournisseurs » n'existe
      pas dans le fichier ».
    - L'encadré « Structure attendue du document ADEME » décrit le format
      attendu.
    - Aucune ligne n'est créée dans `Approvisionnement_extrait_d_un_document`.
- Variantes à couvrir, chacune avec son message :
    - aucune ligne dont la colonne A porte le mot « fournisseur » ou
      « fournisseurs » (majuscules et accents indifférents) dans les 40
      premières lignes ;
    - colonne manquante (Sous catégorie, Tonnage, Répartition approximative) ;
    - tonnage non numérique.

**E2E-2.1.4 — Copier le message d'erreur**

- Préconditions : E2E-2.1.3.
- Étapes : cliquer sur « Copier ».
- Attendu : le bouton affiche « Copié » ; le presse-papiers contient le message.

**E2E-2.1.5 — Échec du téléchargement puis nouvelle tentative**

- Préconditions : fichier indisponible (réseau coupé, ou fausses données : le
  document d'Égletons échoue au premier téléchargement).
- Étapes :
    1. Lancer l'extraction : le message commence par « le téléchargement du
       fichier a échoué (… ) ».
    2. Cliquer sur « Recommencer l'extraction ».
- Attendu : la seconde tentative réussit et le widget passe à l'onglet 3.

**E2E-2.1.6 — Choisir un autre document après une erreur**

- Étapes : depuis l'erreur, cliquer sur « Choisir un autre document ».
- Attendu : retour à l'onglet 1, le plan et le document restent sélectionnés.

### 2.2 Télécharger le document depuis le contexte

**E2E-2.2.1 — Téléchargement depuis l'onglet Extraction**

- Étapes : dans le contexte, cliquer sur le nom du document (icône de
  téléchargement).
- Attendu :
    - Le fichier est téléchargé sous son nom d'origine, identique au fichier joint
      dans Grist.
    - Le lien s'annonce « Télécharger <nom du fichier> » au lecteur d'écran.

**E2E-2.2.2 — Téléchargement depuis l'onglet Vérification et import**

- Attendu : même comportement qu'en E2E-2.2.1.

**E2E-2.2.3 — Téléchargement après une longue attente**

- Étapes : rester plus de 15 minutes sur l'onglet, puis cliquer sur le lien.
- Attendu : le téléchargement fonctionne (le jeton d'accès est demandé au
  clic, il n'a pas expiré).

**E2E-2.2.4 — Échec du téléchargement**

- Préconditions : Grist injoignable au moment du clic.
- Attendu : « Le téléchargement a échoué. Réessayez. » ; un nouveau clic
  relance le téléchargement.

---

## 3. Vérification et import

### 3.1 Le tableau « Lignes extraites »

**E2E-3.1.1 — En-tête et contexte**

- Attendu :
    - Contexte : « Plan : … », « Document : … » (lien de téléchargement), badge
      « N lignes extraites le JJ/MM/AAAA », au singulier pour une seule ligne
      (« 1 ligne extraite le … »).
    - Colonnes, dans l'ordre : État, Ligne, Fournisseur, Ressource, Répartition
      par provenance.

**E2E-3.1.2 — Contenu des colonnes**

- Attendu, pour chaque ligne :
    - Ligne : le numéro de la ligne dans la feuille « Fournisseurs » ; lignes
      triées par ce numéro.
    - Fournisseur : la dénomination du fournisseur trouvé, sinon « Aucun ».
    - Ressource : la description longue de la ressource trouvée, sinon
      « Aucune ».
    - Répartition par provenance : « N provenances · T % » (T = total des
      pourcentages), « 1 provenance · T % » ou « Aucune provenance ».

**E2E-3.1.3 — Colonne État**

- Attendu :
    - Ligne déjà présente : badge vert « Déjà présente » et bouton « Voir »,
      annoncé « Voir la ligne N ».
    - Ligne pas encore créée : badge gris « Pas créée » et bouton « Modifier »,
      annoncé « Modifier la ligne N ».
    - L'état reflète la colonne formule `Etat` : « Créés » dès qu'un
      approvisionnement existe pour le même plan, fournisseur et ressource.

**E2E-3.1.4 — Déplier la répartition**

- Étapes : cliquer sur « N provenances ».
- Attendu :
    - Une ligne de détail s'ouvre sous la ligne (`aria-expanded="true"`).
    - Chaque provenance est listée :
      « <Département (code)> : X % · Y tonnes MV/an », ou le nom
      du pays pour un pays étranger.
    - Un second clic referme le détail.
- Ligne sans provenance : le détail affiche « Aucune provenance trouvée. ».

**E2E-3.1.5 — Lignes en doublon**

- Préconditions : deux lignes du document avec le même fournisseur et la même
  ressource.
- Étapes : importer l'une des deux.
- Attendu : après l'import, les deux lignes passent à « Déjà présente » (même plan,
  fournisseur et ressource).

**E2E-3.1.6 — Voir une ligne déjà présente**

- Étapes : cliquer sur « Voir » d'une ligne « Déjà présente ».
- Attendu : la modale « Ligne N » s'ouvre en lecture seule, avec « Données du
  document » et « Données retenues » (fournisseur, ressource, répartition),
  sans sélecteur ni bouton d'import.

**E2E-3.1.7 — Répartition incomplète : pas de remise à 100 %**

- Préconditions : une ligne dont une part de la répartition n'est pas
  reconnue, par exemple « 40% Grand Est, 60% Allemagne ».
- Attendu :
    - Seules les parts reconnues sont gardées, avec leur pourcentage écrit : ici
      « Allemagne : 60 % », et non 100 %.
    - La cellule affiche « 1 provenance · 60 % » ; le total inférieur à 100 %
      signale la part manquante.
    - Dans la modale : « Total : 60 % · … » et « Non reconnu : 40%, grand
      est ».
    - Une liste de départements sans pourcentage (« 88, 54 ») reste partagée à
      parts égales (50 % chacun) ; « 60% 88, 68, 54 » donne 60 %, 20 %, 20 %.

### 3.2 La modale

**E2E-3.2.1 — Ouverture et fermeture**

- Étapes : cliquer sur « Modifier » d'une ligne (ou « Voir », voir 3.1.6).
- Attendu :
    - La modale « Ligne N » s'ouvre ; le focus est dans la modale.
    - « Fermer », la touche Échap, un clic sur le fond et « Annuler » la
      ferment ; le focus revient sur le bouton « Modifier » d'origine.

**E2E-3.2.2 — Données du document**

- Attendu : sous le titre « Données du document » (titre de niveau `fr-h6`,
  bien distinct du reste), tels que lus dans le fichier : Fournisseur, Sous catégorie de combustible, Tonnage / an,
  Répartition par provenance, Données additionnelles.

**E2E-3.2.3 — Fournisseur et ressource trouvés**

- Attendu :
    - Section « Données à créer » (même niveau de titre que « Données du
      document ») : champ « Fournisseur » (combobox, options « DÉNOMINATION —
      SIRET ») et sélecteur « Ressource » (« code · description »).
    - Fournisseur trouvé : il est déjà choisi, son libellé est dans le champ.
    - Pas de fournisseur trouvé : champ vide en erreur, « Aucune
      correspondance trouvée ».
    - Ressource trouvée : valeur présélectionnée, « Correspondance trouvée ».

**E2E-3.2.4 — Changer la ressource**

- Étapes : choisir une autre ressource.
- Attendu :
    - Dans `Approvisionnement_extrait_d_un_document` et
      `Ressource` de la ligne pointent vers les nouveaux choix.
    - Après fermeture et réouverture de la modale, puis rechargement du widget,
      les choix sont conservés.
    - Le tableau affiche les nouvelles valeurs.
- Si l'enregistrement échoue (Grist injoignable) : « Le choix n'a pas pu être
  enregistré. Réessayez. ».
  **E2E-3.2.4 — Changer le fournisseur**
  Changer le fournisseur
  Parcours
  Je cherche par nom ou par SIRET (les espaces sont ignorés).
  Introuvable : « Ajouter… » en fin de liste ouvre le formulaire « Nouveau fournisseur ». Un SIRET déjà tapé est pré-rempli.
  SIRET valide → la dénomination est récupérée automatiquement, non modifiable.
  « Ajouter le fournisseur » : il est créé, sélectionné, et le focus revient sur le champ Fournisseur.
  Je me suis trompée : je modifie ou j'efface (✕), puis je choisis ou j'ajoute un autre fournisseur.

**E2E-3.2.5 — Modifier la répartition**

- Étapes :
    1. Changer la provenance d'une ligne de répartition.
    2. Modifier « Répartition (%) » : le tonnage suit.
    3. Modifier « Tonnage (en tonne MV/an) » : le pourcentage
       suit.
    4. « Ajouter une provenance », puis « Supprimer la provenance N ».
- Attendu :
    - Le total « Total : X % · Y tonnes MV/an » est mis à jour.
    - Chaque changement est enregistré dans `Repartition_par_provenance` (JSON)
      au changement de sélection, à l'ajout, à la suppression, ou quand on
      quitte un champ numérique.
    - Les éléments non reconnus du document sont listés sous « Non reconnu : … ».

**E2E-3.2.6 — Résumé et bouton d'import**

- Attendu :
    - Fournisseur, ressource et au moins une provenance choisis : bouton
      « Importer les N approvisionnements », ou « Importer l'approvisionnement »
      pour une seule, sans autre texte.
    - Sinon : « Choisissez un fournisseur, une ressource et au moins une
      provenance. » et bouton « Importer » désactivé.
    - Une provenance « Choisir » non renseignée désactive l'import.

**E2E-3.2.7 — Importer**

- Étapes : cliquer sur « Importer les N approvisionnements ».
- Attendu :
    - La modale se ferme ; la ligne passe à « Déjà présente » dans le tableau.
    - Au-dessus du tableau, l'alerte de succès « Ligne N importée : M
      approvisionnements créés dans Approvisionnement. » ; le focus est sur
      l'alerte.
    - Les lignes créées sont vérifiées en 3.5.
- Si l'import échoue : « L'import a échoué. Réessayez. », la modale reste
  ouverte.

### 3.3 Vérifier la création d'un pays

**E2E-3.3.1 — Ouvrir le formulaire**

- Préconditions : `LIGNE_SANS`, modale ouverte.
- Étapes : « Ajouter une provenance ».
- Attendu :
    - Sous la ligne dont la provenance est « Choisir » : « Pays absent de la
      liste ? Créer un pays ».
    - Au clic : champ « Nouveau pays » avec les boutons « Créer le pays » et
      « Annuler » ; le focus est dans le champ.

**E2E-3.3.2 — Validations**

| Saisie                                      | Message attendu                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| vide                                        | « Saisissez le pays. »                                                   |
| « France », « france »                      | « La France se choisit par département, dans la liste des provenances. » |
| un pays existant, casse ou accents modifiés | « Ce pays existe déjà : <Pays>. » et bouton « Choisir ce pays »          |

- Le message disparaît dès que la saisie change.
- « Choisir ce pays » sélectionne le pays existant dans la ligne et ferme le
  formulaire.

**E2E-3.3.3 — Créer le pays**

- Étapes : saisir un pays absent de la liste, valider avec « Créer le pays »
  ou Entrée.
- Attendu :
    - Le pays est choisi dans la ligne ; « Pays « <Pays> » créé » s'affiche sous
      la ligne ; le focus revient sur le sélecteur « Provenance ».
    - Le pays apparaît dans le groupe « Pays étrangers » des sélecteurs des
      autres lignes, et des autres modales.
    - Dans Grist : les choix de la colonne `Approvisionnement.Pays_de_provenance`
      contiennent le nouveau pays ; les choix existants sont inchangés.
    - Après rechargement du widget, le pays est toujours proposé.

**E2E-3.3.4 — Annuler**

- Attendu : le formulaire se ferme, rien n'est créé, le focus revient sur le
  sélecteur.

### 3.4 Vérifier la recherche et la création d'un fournisseur

**E2E-3.4.1 — Chercher un fournisseur**

- Préconditions : modale ouverte.
- Étapes et attendus :
    - Taper une partie du nom, sans tenir compte des majuscules ni des
      accents : la liste ne garde que les fournisseurs correspondants, la
      partie trouvée en gras, la 1re ligne active.
    - Taper une partie du SIRET : la liste garde les fournisseurs dont le
      SIRET la contient.
    - ↓/↑ parcourent la liste (en boucle), Entrée choisit, le survol rend une
      ligne active.
    - Rien ne correspond : « Aucun résultat ne correspond à « … ». ».
    - Les entreprises sans dénomination ne sont pas proposées.
- Après un choix : le champ affiche « DÉNOMINATION — SIRET », la liste
  marque le fournisseur choisi d'une coche, et `Fournisseur` de la ligne dans
  `Approvisionnement_extrait_d_un_document` pointe vers lui.

**E2E-3.4.2 — Changer d'avis**

- Modifier le texte après un choix annule la sélection et rouvre la liste.
- ✕ « Effacer « Fournisseur » » vide le champ et la sélection, garde le focus
  dans le champ et rouvre la liste complète.
- Échap ferme la liste, puis, liste fermée, efface la saisie. La modale reste
  ouverte.
- Quitter le champ avec un texte non choisi : si le texte correspond
  exactement à une option, elle est choisie ; sinon « Choisissez une valeur
  dans la liste ou ajoutez-en une. ».

**E2E-3.4.3 — Ouvrir l'ajout**

- La dernière ligne de la liste propose l'ajout :
    - saisie numérique : « Ajouter le fournisseur avec le SIRET 412 345 678
      00019 » ;
    - sinon : « Ajouter un nouveau fournisseur » ;
    - absente si la saisie est exactement le SIRET d'un fournisseur connu.
- Choisir cette ligne ouvre le bloc « Nouveau fournisseur » sous le champ ;
  le SIRET déjà tapé y est pré-rempli et le focus est dans « SIRET ».
- Le lien « Chercher sur l'Annuaire des Entreprises » (nouvelle fenêtre)
  cherche le nom tapé, ou à défaut le fournisseur lu dans le document.

**E2E-3.4.4 — Règles du SIRET**

| Saisie                                      | Message attendu                                                                          | Quand                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| autre chose que des chiffres et des espaces | « Le SIRET ne doit contenir que des chiffres. »                                          | immédiatement                                       |
| vide                                        | « Renseignez le SIRET du fournisseur. »                                                  | à l'ajout                                           |
| moins ou plus de 14 chiffres                | « Le SIRET doit contenir 14 chiffres (n saisis). »                                       | à la sortie du champ, à l'ajout, ou dès 15 chiffres |
| SIRET d'un fournisseur connu                | « Ce SIRET est déjà utilisé par le fournisseur « X ». » et bouton « Sélectionner « X » » | immédiatement                                       |

- Le compteur « n / 14 chiffres » suit la saisie.
- « Sélectionner « X » » choisit ce fournisseur, ferme le bloc et rend le
  focus au champ Fournisseur.

**E2E-3.4.5 — Dénomination trouvée par l'API**

- Dès que le SIRET passe les règles, la dénomination est cherchée
  (« Recherche de la dénomination en cours… »).
- Trouvée : « Établissement trouvé. », la dénomination remplit le champ
  « Dénomination », qui n'est pas modifiable.
- Inconnue : « Aucun établissement actif trouvé pour ce SIRET. Vérifiez le
  numéro. ».
- Service indisponible ou trop lent (6 s) : « Le service de recherche est
  momentanément indisponible. » et bouton « Réessayer ».
- Une réponse arrivée après une modification du SIRET est ignorée.
- Fausses données (hors Grist) : un SIRET commençant par 000 est introuvable,
  99999999999999 rend le service indisponible.

**E2E-3.4.6 — Ajouter le fournisseur**

- « Ajouter le fournisseur » (ou Entrée dans le SIRET), dénomination trouvée :
    - le bloc se ferme, le fournisseur est choisi et le focus revient sur le
      champ Fournisseur ;
    - message « Fournisseur « X » ajouté et sélectionné. » ;
    - dans Grist : une nouvelle ligne `Entreprise` (`Siret`, `Denomination`) et
      `Fournisseur` de la ligne extraite qui pointe vers elle ;
    - le nouveau fournisseur est proposé dans les autres lignes.
- Dénomination pas encore trouvée : « La dénomination doit être trouvée pour
  ajouter le fournisseur. », rien n'est créé.

**E2E-3.4.7 — Annuler l'ajout**

- « Annuler » ou Échap : le bloc se ferme, rien n'est créé dans
  `Entreprise`, le focus revient sur le champ Fournisseur, la modale reste
  ouverte.

### 3.5 Vérifier ce qui a été créé dans la table Approvisionnement

**E2E-3.5.1 — Une ligne par provenance**

- Préconditions : une ligne avec un fournisseur, une ressource, un tonnage T
  et une répartition de N provenances, importée en 3.2.7.
- Attendu : N nouvelles lignes dans `Approvisionnement`, une par provenance,
  avec :

| Colonne                                        | Valeur attendue                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `Plan_d_approvisionnement`                     | le plan sélectionné                                                      |
| `Fournisseur`                                  | l'entreprise choisie (même SIRET)                                        |
| `Ressource`                                    | la ressource choisie (même code)                                         |
| `Departement_de_provenance`                    | le département pour une provenance française, vide pour un pays étranger |
| `Pays_de_provenance`                           | « France » pour un département, le nom du pays sinon                     |
| `Total_en_tMv_an_`                             | T × pourcentage / 100                                                    |
| `Donnees_additionnelles_provenant_du_document` | les données additionnelles lues dans le document                         |
| `Source`                                       | la ligne de `Piece_jointe` qui contient le document extrait              |

- La somme des `Total_en_tMv_an_` créés vaut T × total des pourcentages / 100.

**E2E-3.5.2 — Pays créé pendant la vérification**

- Préconditions : E2E-3.3.3 puis import.
- Attendu : `Pays_de_provenance` contient le nouveau pays et la valeur est
  valide (reconnue parmi les choix de la colonne, pas signalée en erreur par
  Grist).

**E2E-3.5.3 — Fournisseur créé pendant la vérification**

- Préconditions : E2E-3.4.6 puis import.
- Attendu : `Fournisseur` pointe vers la nouvelle ligne de `Entreprise`.

**E2E-3.5.4 — État de la ligne extraite**

- Attendu : dans `Approvisionnement_extrait_d_un_document`, `Etat` de la ligne
  importée vaut « Créés » (calculé par la formule, le widget ne l'écrit
  pas).

**E2E-3.5.5 — Pas de création sans données suffisantes**

- Préconditions : une ligne sans fournisseur, ou sans ressource, ou avec une
  provenance non choisie.
- Attendu : le bouton « Importer » est désactivé ; aucune ligne n'est créée.

**E2E-3.5.6 — Import en double**

- Étapes : importer deux fois la même combinaison plan / fournisseur /
  ressource, depuis deux lignes différentes.
- Attendu : les approvisionnements sont créés les deux fois (pas de
  dédoublonnage à l'import) ; l'alerte de l'onglet 1 en tient compte.

**E2E-3.5.7 — Retour à la sélection**

- Étapes : après un import, revenir à l'onglet 1.
- Attendu : le décompte des lignes déjà présentes du document (1.1) et l'alerte des
  approvisionnements du plan (1.2) sont à jour.
