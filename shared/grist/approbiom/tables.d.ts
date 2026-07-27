/**
 * Auto-generated Grist type definitions
 * Generated: 2026-07-26T14:54:01.998Z
 * Document ID: gimgk9U5dnfd
 */

import type { GristObjCode, CellValue } from '../grist/types'

export type Installation = {
    id_installation: number | boolean | null
    Nom: string
    Type: number | boolean // Ref -> Type_d_installation
    Usage_detaille: number | boolean // Ref -> Usage
    Commentaire: string
    Siret_Exploitant: number | boolean | null
    Commune: number | boolean // Ref -> INSEE_Commune
    Usage_principal: number | boolean | null // Formula, Ref -> Usage_Principal
    Siret_Proprietaire: number | boolean | null
    Puissance_de_l_installation_en_Mega_Watt_: number | boolean | null
    Production_thermique_annuelle_en_Mega_Watt_: number | boolean | null
    Cree_le: number | boolean | null
    Usage_detaille_claire: string
}

export type Plan_d_approvisionnement = {
    id: number // Implicit Grist rowId
    Installation: number | boolean // Ref -> Installation
    Mise_en_service_Projet_raw: number | boolean | null
    MES_Reel: number | boolean | null
    id_pa: number | boolean | null
    Type_de_plan: string
    Nature_Donnee: string
    Statut: string
    Commentaire: string
    Derniere_mise_a_jour: number | boolean | null
    Nom: string | null // Formula
    Usage_principal: string | null // Formula
    Appel_a_projet: string | null // Formula
    Mise_en_service_projet: string | null // Formula
    Departement_de_situation: string | null // Formula
    Installation_Nom: string | null // Formula
    Voir_la_fiche: string
    est_Laureat: string
    CRB_competentes: string | null // Formula
    demande_subvention: [GristObjCode.List, ...CellValue[]] | null // RefList -> Demande_subvention
    Voir_les_ressources: string | null // Formula
}

export type Instruction = {
    id_instruction: number | boolean | null
    prog_aides: number | boolean // Ref -> Prog_aides
    date_avis_crb: number | boolean | null
    avis_crb: string
    Laureat: string
    Cout_total: number | boolean | null
    subvention: number | boolean | null
    date_sign_prefet: number | boolean | null
    avis_prefet: string
    audition_crb: number | boolean | null
    date_cra: number | boolean | null
    id_planappro: number | boolean // Ref -> Plan_d_approvisionnement
}

export type Prog_aides = {
    id_prog_aides: number | boolean | null
    Annee: number | boolean | null
    Nom_raccourci: string
    autorite_gest: string
    Nom_complet: string
    date_ouv: number | boolean | null
    date_releve: number | boolean | null
    date_clot: number | boolean | null
    date_laureat: number | boolean | null
    date_rep_crb: number | boolean | null
    Appel_a_projet: unknown // Formula
}

export type INSEE_Departement = {
    DEP: string
    REG: number | boolean // Ref -> INSEE_Region
    CHEFLIEU: string
    TNCC: number | boolean | null
    NCC: string
    NCCENR: string
    LIBELLE: string
    Centre_geographique_departements_latitude: unknown // Formula
    Centre_geographique_departements_longitude: unknown // Formula
}

export type INSEE_Region = {
    REG: string
    CHEFLIEU: string
    TNCC: string
    NCC: string
    NCCENR: string
    LIBELLE: string
    INSEE_Departement: [GristObjCode.List, ...CellValue[]] | null // RefList -> INSEE_Departement
}

export type Donnees_INSEE = {
    A: string
}

export type Page_Espace_de_travail_CRB = {
    A: string
    Lien_de_la_page: string
    Page: string
}

export type Page_Donnees_Sources = {
    A: string
}

export type INSEE_Commune = {
    TYPECOM: string
    COM: string
    REG: string
    DEP: string
    CTCD: string
    ARR: string
    TNCC: number | boolean | null
    NCC: string
    NCCENR: string
    LIBELLE: string
    CAN: number | boolean | null
    COMPARENT: string
}

export type Usage_Principal = {
    Libelle: string
}

export type Centre_geographique_departements = {
    A: number | boolean // Ref -> INSEE_Departement
    B: string
    C: number | boolean | null
    D: string
    E: string
    Commune: string
    longitude: string | null // Formula
    latitude: unknown // Formula
}

export type Parametres_Concurrence = {
    Ressource: number | boolean // Ref -> Meta_Ressource
    Departement: [GristObjCode.List, ...CellValue[]] | null // RefList -> INSEE_Departement
    utilisateur: string
    Duplica_dans_utilisateur: boolean | 1 | 0 | null // Formula
}

export type Enumeration = {
    A: string
}

export type Test_NR_Resultat = {
    Plan_d_appro: string | null // Formula
    installations: unknown // Formula
}

export type Test_plansappro = {
    id_installation26: number | boolean | null
    mes_projet: number | boolean | null
    mes_reel: number | boolean | null
    id_planappro: number | boolean | null
    type_pa: string
    nature_pa: string
    statut_pa: string
    commentaire: string
}

export type Usage = {
    Libelle: string
    Usage_principal: number | boolean // Ref -> Usage_Principal
}

export type Test_provenance = {
    id_ressource: number | boolean // Ref -> Test_ressource
    reg: number | boolean | null
    tonnage_reg_an_mv: number | boolean | null
    dept: number | boolean | null
    commentaire: string
    pays: string
    m3_reg_an: number | boolean | null
    id_instal_producteur: number | boolean | null
    tonnage_dep_an_mv: number | boolean | null
    tonnage_reg_an_mv_supp: number | boolean | null
    m3_reg_an_supp: number | boolean | null
    tonnage_dep_an_mv_supp: number | boolean | null
    id_ressource_claire_fournisseur: [GristObjCode.List, ...CellValue[]] | null // Formula, RefList -> Claire_fournisseur
    Departements_concernes: unknown // Formula
    info_fournisseurs: unknown // Formula
    id_planappro: number | boolean | null // Formula, Ref -> Test_plansappro
    id_planappro_type_pa: string | null // Formula
    id_ressource_libelle_ressource: string | null // Formula
    Test_ressource_Filtre_PA_restant_a_integrer: string | null // Formula
    id_ressource_claire_fournisseur_nom_fournisseur: unknown // Formula
    id_ressource_claire_fournisseur_nom_fournisseur2: unknown // Formula
    Filtre_pas_de_departement: unknown // Formula
    id_ressource_claire_fournisseur_nom_fournisseur3: unknown // Formula
    Integre: boolean | 1 | 0 | null
}

export type Tables_Claires = {
    A: string
    B: unknown // Formula
    C: unknown // Formula
}

export type Page_Tests = {
    A: string
}

export type Fournisseur = {
    id: number // Implicit Grist rowId
    Siret: number | boolean | null
    Denomination: string
    Code_NAF: string
    Duplica_dans_Siret: boolean | 1 | 0 | null // Formula
}

export type Test_ressource = {
    id_ressource: number | boolean | null
    id_installation: number | boolean | null
    tonnage_an_mv: number | boolean | null
    autoconso: string
    libelle_ressource: string
    long_min: string
    long_max: string
    diam_min: string
    diam_max: number | boolean | null
    diam_med: unknown
    essence_1: string
    essence_2: string
    commentaire: string
    taux_certif: string
    m3_an: number | boolean | null
    adm: string
    avis_adm: string
    date_avis_adm: number | boolean | null
    commentaire_avis: string
    tonnage_an_ms: number | boolean | null
    pci_mwh: number | boolean | null
    code_ressource: unknown
    id_planappro: number | boolean // Ref -> Test_plansappro
    tonnage_an_mv_supp: number | boolean | null
    m3_an_supp: number | boolean | null
    claire_fournisseur: [GristObjCode.List, ...CellValue[]] | null // RefList -> Claire_fournisseur
    test_provenance: [GristObjCode.List, ...CellValue[]] | null // RefList -> Test_provenance
    Filtre_PA_restant_a_integrer: unknown // Formula
}

export type Test_installations = {
    id_installation: number | boolean | null
    nom_installation: string
    type_installation: string
    exploitant: string
    proprietaire: string
    usage_1: string
    usage_2: string
    commentaire: string
    siret_exploitant: number | boolean | null
    insee: number | boolean | null
    siret_proprietaire: unknown
}

export type Meta_Ressource = {
    id: number // Implicit Grist rowId
    id_meta_r: number | boolean | null
    Famille_ressource: string
    Code_ressource_Approbiom: string
    ademe_2017: string
    Description: string
    cre_categ: number | boolean | null
    libelle_cre: string
    Unite_usuelle: string
    RED_III: unknown
    Duplica_dans_Code_ressource_Approbiom: boolean | 1 | 0 | null // Formula
    Description_courte: string
    Duplica_dans_Description_courte: boolean | 1 | 0 | null // Formula
}

export type Type_d_installation = {
    Type_installation: string
    Type_de_Production: string
    unite_production_annuelle: string
    Puissance_thermique_utile_de_combustion: string
    Libelle_produit: string
    Usage_principal: string
}

export type Referentiel_des_pays_et_des_territoires = {
    ID2: string
    NOM_ALPHA: string
    NOM_COURT: string
    ARTICLE: string
    ISO_ETAT: string
    NOM_LONG_ETAT: string
    ISO_3166_NOM: string
    IND_TEL_UIT: number | boolean | null
    ISO_CODE_NUM: string
    ISO_alpha3: string
    ISO_alpha2: string
    SOUVERAIN: string
    NOM_ONU: string
    CODE_COG: number | boolean | null
}

export type Documentation = {
    Contenu: string
    titre: string
}

export type Test_unitaire = {
    Plan_d_appro: number | boolean // Ref -> Plan_d_approvisionnement
    Tonnage_total_theorique: number | boolean | null
    Tonnage_retenu_theorique: number | boolean | null
    Parametre_ressource_theorique: number | boolean // Ref -> Meta_Ressource
    Departements_retenus_theorique: [GristObjCode.List, ...CellValue[]] | null // RefList -> INSEE_Departement
    Parametre_departements_cibles: [GristObjCode.List, ...CellValue[]] | null // RefList -> INSEE_Departement
}

export type Approvisionnement = {
    Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
    Fournisseur: number | boolean // Ref -> Entreprise
    Ressource: number | boolean // Ref -> Meta_Ressource
    Departement_de_provenance: number | boolean // Ref -> INSEE_Departement
    Total_en_tMv_an_: number | boolean | null
    Region: unknown // Formula
    Respect_contrainte_unicite: boolean | 1 | 0 | null // Formula
    Commentaire: string
    Derniere_mise_a_jour: number | boolean | null
}

export type Approvisionnement_summary_Plan_d_approvisionnement = {
    Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
    group: [GristObjCode.List, ...CellValue[]] | null // Formula, RefList -> Approvisionnement
    count: number | boolean | null // Formula
    Total_en_tMv_an_: number | boolean | null // Formula
}

export type Approvisionnement_summary_Plan_d_approvisionnement_Ressource = {
    Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
    Ressource: number | boolean // Ref -> Meta_Ressource
    group: [GristObjCode.List, ...CellValue[]] | null // Formula, RefList -> Approvisionnement
    count: number | boolean | null // Formula
    Total_en_tMv_an_: number | boolean | null // Formula
    Departements_formattes: string | null // Formula
    Approvisionnements_retenus: unknown // Formula
    Departements_retenus: unknown // Formula
    Tonnage_retenu_en_tMv_an_: number | boolean | null // Formula
    estGarde: boolean | 1 | 0 | null // Formula
    Departement_de_situation: unknown // Formula
    Appel_a_projet: unknown // Formula
}

export type Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource =
    {
        Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
        Ressource: number | boolean // Ref -> Meta_Ressource
        Departement_de_provenance: number | boolean // Ref -> INSEE_Departement
        group: [GristObjCode.List, ...CellValue[]] | null // Formula, RefList -> Approvisionnement
        count: number | boolean | null // Formula
        Total_en_tMv_an_: number | boolean | null // Formula
    }

export type Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource =
    {
        Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
        Ressource: number | boolean // Ref -> Meta_Ressource
        Region: unknown
        group: [GristObjCode.List, ...CellValue[]] | null // Formula, RefList -> Approvisionnement
        count: number | boolean | null // Formula
        Total_en_tMv_an_: number | boolean | null // Formula
    }

export type Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource =
    {
        Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
        Fournisseur: number | boolean // Ref -> Entreprise
        Ressource: number | boolean // Ref -> Meta_Ressource
        group: [GristObjCode.List, ...CellValue[]] | null // Formula, RefList -> Approvisionnement
        count: number | boolean | null // Formula
        Total_en_tMv_an_: number | boolean | null // Formula
    }

export type Claire_fournisseur = {
    id_fournisseur: number | boolean | null
    nom_fournisseur: string
    tonnage_an_mv: number | boolean | null
    id_ressource: number | boolean // Ref -> Test_ressource
    commentaire: string
}

export type Correspondance_Fournisseur = {
    Old_fournisseur: string
    New_fournisseur: number | boolean // Ref -> Entreprise
    New_fournisseur_texte: string
}

export type Correspondance_Libelle_Ressource = {
    Old_libelle_ressource: string
    New_libelle_ressource: number | boolean // Ref -> Meta_Ressource
    New_libelle_ressource_Code_ressource_Approbiom: string | null // Formula
}

export type Page_Migration_de_donnees = {
    A: unknown // Formula
    B: unknown // Formula
    C: unknown // Formula
}

export type Piece_jointe = {
    Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
    type: string
    piece_jointe: [GristObjCode.List, ...CellValue[]] | null
}

export type Subvention = {
    id_aides: number | boolean | null
    id_prog_aides: number | boolean // Ref -> Prog_aides
    date_avis_crb: number | boolean | null
    avis_crb: string
    laureat: string
    commentaire: string
    cout_total: number | boolean | null
    subvention: number | boolean | null
    date_sign_prefet: number | boolean | null
    avis_prefet: string
    audition_crb: number | boolean | null
    date_cra: number | boolean | null
    id_installation26: number | boolean | null
    id_planappro: number | boolean // Ref -> Plan_d_approvisionnement
    Nom: string
}

export type Crb = {
    id: number // Implicit Grist rowId
    Nom: string
    Region: number | boolean // Ref -> INSEE_Region
}

export type Instruction_crb = {
    id: number // Implicit Grist rowId
    crb: number | boolean // Ref -> Crb
    subvention: number | boolean // Ref -> Demande_subvention
    Plan_d_approvisionnement: unknown // Formula
    Avis_CRB_Requis: boolean | 1 | 0 | null
    Date_saisine_CRB: number | boolean | null
    Date_avis_CRB: number | boolean | null
    Avis_CRB: string
    Date_avis_Prefet: number | boolean | null
    Avis_Prefet: string
    Avis_CRB_PJ: [GristObjCode.List, ...CellValue[]] | null
    Fichier_recupere_de_la_prefecture:
        [GristObjCode.List, ...CellValue[]] | null
    Fiche_analyse_CRB: [GristObjCode.List, ...CellValue[]] | null
    Phase_de_l_instruction: string | null // Formula
}

export type Demande_subvention = {
    id: number // Implicit Grist rowId
    id_demande_subvention: unknown // Formula
    Programme_d_aide: number | boolean // Ref -> Prog_aides
    Plan_d_approvisionnement: number | boolean // Ref -> Plan_d_approvisionnement
    instruction_crb: [GristObjCode.List, ...CellValue[]] | null // RefList -> Instruction_crb
}
