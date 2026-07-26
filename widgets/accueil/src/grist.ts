import type {
    FetchedData,
    TableSpec,
} from '@shared/grist/approbiom/getApprobiomTables'

export const ACCUEIL_SPEC = {
    Plan_d_approvisionnement: [
        'Nom',
        'Departement_de_situation',
        'Appel_a_projet',
        'Type_de_plan',
        'Usage_principal',
        'Mise_en_service_projet',
        'Nature_Donnee',
        'Statut',
    ],
} as const satisfies TableSpec

export type PlanDapprovisionnementAccueil = FetchedData<
    typeof ACCUEIL_SPEC
>['Plan_d_approvisionnement'][number]
