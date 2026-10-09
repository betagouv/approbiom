/**
 * Every metadata table id and column list the adapters read, in one place.
 */
export const METADATA_TABLE = {
    gristAttachment: {
        id: '_grist_Attachments',
        columnIds: ['id', 'fileName', 'fileSize'],
    },
}

export /**
 * Every user table id and column list the adapters read, in one place.
 */
const TABLE = {
    approvisionnement: 'Approvisionnement',
    totalByPlanAndRessource:
        'Approvisionnement_summary_Plan_d_approvisionnement_Ressource',
    totalByRegionOuPays:
        'Approvisionnement_summary_Plan_d_approvisionnement_Region_francaise_ou_Pays_etranger_Ressource',
    totalByFournisseur:
        'Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource',
    totalByProvenance:
        'Approvisionnement_summary_Plan_d_approvisionnement_Provenance_Ressource',
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
    aImporterApprovisionnement: 'A_importer_Approvisionnement',
    extractedApprovisionnement: 'Approvisionnement_extrait_d_un_document',
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
        'id',
        'Plan_d_approvisionnement',
        'Ressource',
        'Departement_de_provenance', // ref, est null si la provenance est un pays
        'Provenance', // type texte, soit le code du département, soit le libellé du pays
        'Fournisseur',
        'Total_en_tMv_an_',
    ],
    totalByPlanAndRessource: TOTAL_COLUMNS,
    totalByRegionOuPays: [
        ...TOTAL_COLUMNS,
        'Region_francaise_ou_Pays_etranger',
    ],
    totalByFournisseur: [...TOTAL_COLUMNS, 'Fournisseur'],
    totalByProvenance: [...TOTAL_COLUMNS, 'Provenance'],
    plan: [
        'id',
        'Nom',
        'Installation',
        'Type_de_plan',
        'Usage_principal',
        'Nature_Donnee',
        'Statut',
        'est_Laureat',
        'Code_Insee_Installation',
    ],
    metaRessource: [
        'id',
        'Code_ressource_Approbiom',
        'ademe_2017',
        'Description_courte',
        'Description',
    ],
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
    attachment: ['id', 'Plan_d_approvisionnement', 'piece_jointe', 'type'],
    extractedApprovisionnement: [
        'id',
        'Controle',
        'Document',
        'Plan_d_approvisionnement',
        'Ligne_Excel',
        'Date_d_extraction',
        'Document_fournisseur',
        'Document_ressource',
        'Document_tonnage',
        'Document_repartition_par_provenance',
        'Document_donnees_additionnelles',
        'Fournisseur',
        'Ressource',
        'Repartition_par_provenance',
    ] as const satisfies readonly (keyof ExtractedApprovisionnementColumn)[],
} as const satisfies Record<string, readonly string[]>

type EveryColumnListed<Missing extends never> = Missing

export type ExtractedApprovisionnementColumnsListed = EveryColumnListed<
    Exclude<
        keyof ExtractedApprovisionnementColumn,
        (typeof COLUMNS)['extractedApprovisionnement'][number]
    >
>

export type InstructionColumn = (typeof COLUMNS)['instruction'][number]

export type ProgrammeAideColumn = (typeof COLUMNS)['programmeAide'][number]

export type ExtractedApprovisionnementColumn = {
    id: number
    Controle: string
    Document: number
    Plan_d_approvisionnement: number
    Ligne_Excel: number
    Date_d_extraction: number | null
    Document_fournisseur: string
    Document_ressource: string
    Document_tonnage: string
    Document_repartition_par_provenance: string
    Document_donnees_additionnelles: string
    Fournisseur: number
    Ressource: number
    Repartition_par_provenance: string
}

export type AImporterApprovisionnementColumn = {
    Plan_d_approvisionnement: number
    Excel_Ademe: string
    Ligne_Excel: number
    Fournisseur_valeur_brute: string
    Ressource_valeur_brute: string
    Tonnage_total: number
    Repartition_valeur_brute: string
    Repartition_calculee_par_le_script: string
    Niveau_de_confiance: string
}
