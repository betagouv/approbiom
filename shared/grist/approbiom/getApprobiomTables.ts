import { fetchRows } from '@shared/grist/api/client'
import type {
    Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource,
    Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource,
    Approvisionnement_summary_Plan_d_approvisionnement,
    Approvisionnement_summary_Plan_d_approvisionnement_Ressource,
    Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource,
    Crb,
    Demande_subvention,
    Fournisseur,
    Instruction_crb,
    Meta_Ressource,
    Plan_d_approvisionnement,
} from './tables'

type TableRowMap = {
    Plan_d_approvisionnement: Plan_d_approvisionnement
    Approvisionnement_summary_Plan_d_approvisionnement: Approvisionnement_summary_Plan_d_approvisionnement
    Approvisionnement_summary_Plan_d_approvisionnement_Ressource: Approvisionnement_summary_Plan_d_approvisionnement_Ressource
    Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource: Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource
    Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource: Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource
    Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource: Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource
    Meta_Ressource: Meta_Ressource
    Fournisseur: Fournisseur
    Demande_subvention: Demande_subvention
    Instruction_crb: Instruction_crb
    Crb: Crb
}

export type TableId = keyof TableRowMap

export type ColumnId<K extends TableId> = keyof TableRowMap[K] & string

export type TableSpec = {
    [K in TableId]?: readonly ColumnId<K>[]
}

export type FetchedData<S extends TableSpec> = {
    // K in keyof S & TableId: keeps only key of S of type TableId
    // NonNullable<S[K]> extends readonly (infer C extends ColumnId<K>)[]: S[K] value is a readonly column of K ?
    [K in keyof S & TableId]: NonNullable<
        S[K]
    > extends readonly (infer C extends ColumnId<K>)[]
        ? readonly Pick<TableRowMap[K], C>[]
        : never
}

/**
 * Fetches every table named in `spec` in parallel and returns them keyed by
 * table id, each narrowed to the columns that table asked for. This is the
 * many-tables counterpart of `getApprobiomTable`, and what `useGrist` calls.
 *
 * The runtime loop is untyped (the table ids come from a dynamic object, so TS
 * cannot correlate each id with its own column list); the single `as` cast at
 * the boundary is what restores the precise per-table types, and it is sound
 * because `spec` is already checked against `TableSpec` at the call site.
 *
 */
export async function getApprobiomTables<const S extends TableSpec>(
    spec: S
): Promise<FetchedData<S>> {
    const entries = Object.entries(spec) as [string, readonly string[]][]

    const tables = await Promise.all(
        entries.map(async ([tableId, columnIds]) => {
            const rows = await fetchRows(tableId, columnIds)
            return [tableId, rows] as const
        })
    )

    return Object.fromEntries(tables) as unknown as FetchedData<S>
}
