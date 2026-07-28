import type {
    FetchedData,
    TableSpec,
} from '@shared/grist/approbiom/getApprobiomTables'

export const SPEC = {
    // `id` is the plan's implicit Grist rowId — the value the summaries'
    // Plan_d_approvisionnement Ref points at.
    Plan_d_approvisionnement: ['id', 'Nom'],
    Approvisionnement_summary_Plan_d_approvisionnement_Ressource: [
        'Plan_d_approvisionnement',
        'Ressource',
        'Total_en_tMv_an_',
        'Departements_formattes',
        'Repartition',
    ],
    Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource: [
        'Plan_d_approvisionnement',
        'Ressource',
        'Region',
        'Total_en_tMv_an_',
        'Repartition',
    ],
    Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource: [
        'Plan_d_approvisionnement',
        'Ressource',
        'Fournisseur',
        'Total_en_tMv_an_',
        'Repartition',
    ],
    Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource:
        [
            'Plan_d_approvisionnement',
            'Ressource',
            'Departement_de_provenance',
            'Total_en_tMv_an_',
            'Repartition',
        ],
    // Reference tables, indexed by their rowId to resolve the summaries' Ref
    // columns to a human label. The suppliers live in `Entreprise` — the table
    // the summaries' `Fournisseur` column points at, that column having kept its
    // own name when the table was renamed.
    Meta_Ressource: ['id', 'Description_courte'],
    Entreprise: ['id', 'Denomination'],
} as const satisfies TableSpec

export type Fetched_Plan_d_approvisionnement = FetchedData<
    typeof SPEC
>['Plan_d_approvisionnement'][number]

export type Fetched_Ressource = FetchedData<
    typeof SPEC
>['Approvisionnement_summary_Plan_d_approvisionnement_Ressource'][number]

export type Fetched_Region = FetchedData<
    typeof SPEC
>['Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource'][number]

export type Fetched_Fournisseur = FetchedData<
    typeof SPEC
>['Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource'][number]

export type Fetched_Departement = FetchedData<
    typeof SPEC
>['Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource'][number]

export type Fetched_Meta_Ressource = FetchedData<
    typeof SPEC
>['Meta_Ressource'][number]

export type Fetched_Entreprise = FetchedData<typeof SPEC>['Entreprise'][number]
