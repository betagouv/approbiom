import type { ApprovisionnementGroupedByPlanAndRessource } from '@shared/core/application/ports/approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import {
    asIdList,
    asNumber,
    asString,
    fetchRowsOnce,
    lookup,
    type GristCells,
    type GristRow,
} from '../../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../../types/grist-tables'

export const asText = (value: unknown): string =>
    typeof value === 'number' ? String(value) : asString(value)

export function fournisseurSiret(
    index: Map<number, GristRow>,
    ref: unknown
): string | undefined {
    // Grist answers 0 for a Ref pointing at nothing: in Approvisionnement,
    // `Fournisseur: 0` is an approvisionnement without fournisseur.
    if (ref === 0) return undefined

    const siret = asText(lookup(index, ref)?.Siret)

    return siret === '' ? undefined : siret
}

export const ressourceCode = (
    index: Map<number, GristRow>,
    ref: unknown
): string => asString(lookup(index, ref)?.Code_ressource_Approbiom)

export function toProvenance(
    row: GristRow,
    departements: Map<number, GristRow>
): Provenance {
    const departement = lookup(departements, row.Departement_de_provenance)

    if (departement !== undefined) {
        return { source: DEPARTEMENT_FRANCAIS, code: asString(departement.DEP) }
    }

    const libelle = asText(row.Provenance)

    return libelle === ''
        ? { source: DEPARTEMENT_FRANCAIS, code: '' }
        : { source: PAYS_ETRANGER, libelle }
}

export function toGroup(
    row: GristRow,
    ressources: Map<number, GristRow>
): ApprovisionnementGroupedByPlanAndRessource {
    return {
        planDApprovisionnement: asNumber(row.Plan_d_approvisionnement) ?? 0,
        ressource: ressourceCode(ressources, row.Ressource),
        tonnageTotal: asNumber(row.Total_en_tMv_an_) ?? 0,
        repartition: asNumber(row.Repartition) ?? 0,
    }
}

export const PAYS_DE_PROVENANCE = 'Pays_de_provenance'
export const FRANCE = 'France'

function idsBy<K>(
    rows: readonly GristRow[],
    keysOf: (row: GristRow) => readonly K[]
): ReadonlyMap<K, number> {
    const ids = new Map<K, number>()
    for (const row of rows) {
        const id = asNumber(row.id)
        if (id === undefined) continue
        for (const key of keysOf(row)) ids.set(key, id)
    }
    return ids
}

export type ReferencedTables = {
    entrepriseIdBySiret: ReadonlyMap<string, number>
    ressourceIdByCode: ReadonlyMap<string, number>
    departementIdByDep: ReadonlyMap<string, number>
    attachmentIdByFile: ReadonlyMap<number, number>
}

export async function readReferencedTables(): Promise<ReferencedTables> {
    const [entreprises, ressources, departements, attachments] =
        await Promise.all([
            fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
            fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
            fetchRowsOnce(TABLE.departement, COLUMNS.departement),
            fetchRowsOnce(TABLE.attachment, COLUMNS.attachment),
        ])
    const nonEmpty = (key: string) => (key === '' ? [] : [key])

    return {
        entrepriseIdBySiret: idsBy(entreprises, (row) =>
            nonEmpty(asText(row.Siret))
        ),
        ressourceIdByCode: idsBy(ressources, (row) =>
            nonEmpty(asString(row.Code_ressource_Approbiom))
        ),
        departementIdByDep: idsBy(departements, (row) =>
            nonEmpty(asString(row.DEP))
        ),
        attachmentIdByFile: idsBy(attachments, (row) =>
            asIdList(row.piece_jointe)
        ),
    }
}

// A value the document does not hold would be written as an empty Ref, and
// lost without anyone noticing: it is refused instead.
function refTo<K>(ids: ReadonlyMap<K, number>, key: K, table: string): number {
    const id = ids.get(key)
    if (id === undefined)
        throw new Error(`No row of "${table}" matches "${String(key)}".`)

    return id
}

export function toCells(
    approvisionnement: Partial<Approvisionnement>,
    {
        entrepriseIdBySiret,
        ressourceIdByCode,
        departementIdByDep,
        attachmentIdByFile,
    }: ReferencedTables
): GristCells {
    const {
        planDApprovisionnement,
        fournisseur,
        ressource,
        provenance,
        tonnageTotal,
        additionalDataFromDocument,
        source,
    } = approvisionnement
    const cells: GristCells = {}

    if (planDApprovisionnement !== undefined)
        cells.Plan_d_approvisionnement = planDApprovisionnement
    if (ressource !== undefined)
        cells.Ressource = refTo(
            ressourceIdByCode,
            ressource,
            TABLE.metaRessource
        )
    if (provenance !== undefined) {
        // A département left blank is read that way from the table: it is
        // written back as it was, without a Ref.
        cells.Departement_de_provenance =
            provenance.source === DEPARTEMENT_FRANCAIS && provenance.code !== ''
                ? refTo(departementIdByDep, provenance.code, TABLE.departement)
                : 0
        cells.Pays_de_provenance =
            provenance.source === PAYS_ETRANGER ? provenance.libelle : FRANCE
    }
    if (tonnageTotal !== undefined) cells.Total_en_tMv_an_ = tonnageTotal

    const given = (field: keyof Approvisionnement) => field in approvisionnement
    if (given('fournisseur'))
        cells.Fournisseur =
            fournisseur === undefined
                ? 0
                : refTo(entrepriseIdBySiret, fournisseur, TABLE.entreprise)
    if (given('additionalDataFromDocument'))
        cells.Donnees_additionnelles_provenant_du_document =
            additionalDataFromDocument ?? ''
    if (given('source'))
        cells.Source =
            source === undefined
                ? 0
                : refTo(attachmentIdByFile, source, TABLE.attachment)

    return cells
}

function parseWidgetOptions(value: unknown): Record<string, unknown> {
    try {
        return JSON.parse(asString(value) || '{}') as Record<string, unknown>
    } catch (cause) {
        throw new Error(
            `The options of column "${PAYS_DE_PROVENANCE}" of "${TABLE.approvisionnement}" are not valid JSON.`,
            { cause }
        )
    }
}

// The countries are the choices of the Pays_de_provenance column, kept in its
// widget options.
export async function readPaysDeProvenanceColumn(): Promise<{
    widgetOptions: Record<string, unknown>
    choices: string[]
}> {
    const [tables, columns] = await Promise.all([
        fetchRowsOnce('_grist_Tables', ['id', 'tableId']),
        fetchRowsOnce('_grist_Tables_column', [
            'parentId',
            'colId',
            'widgetOptions',
        ]),
    ])
    const tableRef = tables.find(
        (table) => table.tableId === TABLE.approvisionnement
    )?.id
    const column = columns.find(
        (column) =>
            column.parentId === tableRef && column.colId === PAYS_DE_PROVENANCE
    )
    const widgetOptions = parseWidgetOptions(column?.widgetOptions)
    const { choices } = widgetOptions

    return {
        widgetOptions,
        choices: (Array.isArray(choices) ? choices : []).filter(
            (choice): choice is string => typeof choice === 'string'
        ),
    }
}
