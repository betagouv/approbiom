import type {
    FetchedData,
    TableSpec,
} from '@shared/grist/approbiom/getApprobiomTables'

export const ACCUEIL_SPEC = {
    Plan_d_approvisionnement: [
        'id',
        'Nom',
        'Departement_de_situation',
        'Appel_a_projet',
        'Type_de_plan',
        'Usage_principal',
        'Mise_en_service_projet',
        'Nature_Donnee',
        'Statut',
        'est_Laureat',
        'CRB_competentes',
        'MES_Reel',
    ],
    Demande_subvention: ['id', 'Plan_d_approvisionnement'],
    Instruction_crb: [
        'id',
        'subvention',
        'crb',
        'Phase_de_l_instruction',
        'Date_saisine_CRB',
        'Date_avis_CRB',
        'Date_avis_Prefet',
    ],
    Crb: ['id', 'Nom'],
} as const satisfies TableSpec

export type PlanDapprovisionnementAccueil = FetchedData<
    typeof ACCUEIL_SPEC
>['Plan_d_approvisionnement'][number]

export type DemandeSubventionAccueil = FetchedData<
    typeof ACCUEIL_SPEC
>['Demande_subvention'][number]

export type InstructionCrbAccueil = FetchedData<
    typeof ACCUEIL_SPEC
>['Instruction_crb'][number]

export type CrbAccueil = FetchedData<typeof ACCUEIL_SPEC>['Crb'][number]
