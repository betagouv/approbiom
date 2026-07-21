import type { Plan_d_approvisionnement } from './tables'

export type TableRowMap = {
    Plan_d_approvisionnement: Plan_d_approvisionnement
}

export type TableId = keyof TableRowMap

const TABLE_IDS = {
    Plan_d_approvisionnement: 'Plan_d_approvisionnement',
} as const satisfies { [K in TableId]: K }

export const APPROBIOM_TABLE_IDS = Object.values(TABLE_IDS)

// Runtime mirror of tables.d.ts: types are erased at build time, but we need
// the column ids at runtime to check what the document actually sent back.
// `satisfies Record<keyof ..., true>` makes tsc reject a column that is missing
// here as well as one that no longer exists in the generated types, so this
// list cannot silently drift away from tables.d.ts.
export const TABLE_COLUMNS = {
    Plan_d_approvisionnement: {
        Installation: true,
        Mise_en_service_Projet_raw: true,
        MES_Reel: true,
        id_pa: true,
        Type_de_plan: true,
        Nature_Donnee: true,
        Statut: true,
        Commentaire: true,
        Derniere_mise_a_jour: true,
        deprecie_Synthese: true,
        Nom: true,
        Usage_principal: true,
        Appel_a_projet: true,
        Mise_en_service_projet: true,
        Departement_de_situation: true,
        Installation_Nom: true,
    },
} satisfies { [K in TableId]: Record<keyof TableRowMap[K], true> }

export type ApprobiomTables = { [K in TableId]: TableRowMap[K][] }
