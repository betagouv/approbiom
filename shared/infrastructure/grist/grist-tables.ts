/**
 * Every table id and column list the adapters read, in one place.
 */
export const TABLE = {
    approvisionnement: 'Approvisionnement',
    totalByPlanAndRessource:
        'Approvisionnement_summary_Plan_d_approvisionnement_Ressource',
    totalByRegion:
        'Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource',
    totalByFournisseur:
        'Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource',
    totalByDepartementDeProvenance:
        'Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource',
    plan: 'Plan_d_approvisionnement',
    metaRessource: 'Meta_Ressource',
    entreprise: 'Entreprise',
    departement: 'INSEE_Departement',
    region: 'INSEE_Region',
    demandeSubvention: 'Demande_subvention',
    instruction: 'Instruction_crb',
    crb: 'Crb',
    programmeAide: 'Prog_aides',
    attachment: 'Piece_jointe',
} as const

/** The columns every summary is keyed and measured by, whatever it groups on. */
const TOTAL_COLUMNS = [
    'Plan_d_approvisionnement',
    'Ressource',
    'Total_en_tMv_an_',
    'Repartition',
] as const

export const COLUMNS = {
    approvisionnement: [
        'Plan_d_approvisionnement',
        'Ressource',
        'Departement_de_provenance', // ref, est null si la provenance est un pays
        'Provenance', // type texte, soit le code du département, soit le libellé du pays
        'Fournisseur',
        'Total_en_tMv_an_',
    ],
    totalByPlanAndRessource: TOTAL_COLUMNS,
    totalByRegion: [...TOTAL_COLUMNS, 'Region'],
    totalByFournisseur: [...TOTAL_COLUMNS, 'Fournisseur'],
    totalByDepartementDeProvenance: [
        ...TOTAL_COLUMNS,
        'Departement_de_provenance',
    ],
    plan: [
        'id',
        'Nom',
        'Installation',
        'Type_de_plan',
        'Usage_principal',
        'Nature_Donnee',
        'Statut',
        'est_Laureat',
        // Computed by the document out of the installation's commune. Reading
        // it here is what keeps the 37 000-row INSEE_Commune table, and the
        // Installation table with it, out of every load.
        'Departement_de_situation',
    ],
    metaRessource: ['id', 'Code_ressource_Approbiom', 'Description_courte'],
    entreprise: ['id', 'Siret', 'Denomination'],
    departement: ['id', 'DEP', 'LIBELLE', 'REG'],
    region: ['id', 'REG', 'LIBELLE'],
    demandeSubvention: ['id', 'Programme_d_aide', 'Plan_d_approvisionnement'],
    instruction: [
        'id',
        'Nom',
        'crb',
        'subvention',
        'Avis_CRB_Requis',
        'Date_saisine_CRB',
        'Date_avis_CRB',
        'Avis_CRB',
        'Date_avis_Prefet',
        'Avis_Prefet',
        'Phase_de_l_instruction',
    ],
    crb: ['id', 'Nom'],
    programmeAide: [
        'id',
        'Annee',
        'Nom_complet',
        'Nom_raccourci',
        'Appel_a_projet',
        'Laureat',
    ],
    attachment: ['Plan_d_approvisionnement', 'piece_jointe', 'type'],
} as const satisfies Record<string, readonly string[]>

export type InstructionColumn = (typeof COLUMNS)['instruction'][number]

export type ProgrammeAideColumn = (typeof COLUMNS)['programmeAide'][number]
