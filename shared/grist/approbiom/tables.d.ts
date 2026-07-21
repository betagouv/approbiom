/**
 * Auto-generated Grist type definitions
 * Generated: 2026-07-20T12:34:37.580Z
 * Document ID: gimgk9U5dnfd
 */

export type Plan_d_approvisionnement = {
    Installation: number | boolean // Ref -> Installation
    Mise_en_service_Projet_raw: number | boolean | null
    MES_Reel: number | boolean | null
    id_pa: number | boolean | null
    Type_de_plan: string
    Nature_Donnee: string
    Statut: string
    Commentaire: string
    Derniere_mise_a_jour: number | boolean | null
    deprecie_Synthese: string
    Nom: string
    Usage_principal: number | boolean // Ref -> Usage_Principal
    Appel_a_projet: string
    Mise_en_service_projet: string
    Departement_de_situation: string
    Installation_Nom: string
}
