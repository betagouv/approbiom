import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { ProvenanceParseResults } from '@shared/infrastructure/import-bcib-bciat/transform-provenance/transform-provenance'
import { gristReady } from '../helpers/grist-ready'
import {
    asDate,
    asIdList,
    asNumber,
    asString,
    byRowId,
    createRows,
    fetchRowsOnce,
    updateRow,
    type GristRow,
} from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'
import { toEntreprise } from './grist-adapter-entreprise'
import { toRessource } from './grist-adapter-ressource'

const IMPORTED = 'Importés'
const NOT_IMPORTED = 'Pas importés'

function stateOf(value: unknown): typeof IMPORTED | typeof NOT_IMPORTED {
    return value === IMPORTED ? IMPORTED : NOT_IMPORTED
}

// Attachments are identified by their file; the table points at the
// Piece_jointe row that holds it.
async function findAttachmentRow(
    attachmentId: Attachment['id']
): Promise<GristRow | undefined> {
    const rows = await fetchRowsOnce(TABLE.attachment, COLUMNS.attachment)

    return rows.find((row) => asIdList(row.piece_jointe).includes(attachmentId))
}

function parseProvenance(
    value: unknown,
    rowId: number
): ProvenanceParseResults {
    try {
        return JSON.parse(asString(value)) as ProvenanceParseResults
    } catch (cause) {
        throw new Error(
            `The provenance of row ${rowId} of "${TABLE.extractedApprovisionnement}" is not valid JSON.`,
            { cause }
        )
    }
}

export function createGristExtractedApprovisionnementAdapter() {
    return {
        async listByDocument(attachment: Pick<Attachment, 'id' | 'name'>) {
            await gristReady()

            const [attachmentRow, rows, entrepriseRows, ressourceRows] =
                await Promise.all([
                    findAttachmentRow(attachment.id),
                    fetchRowsOnce(
                        TABLE.extractedApprovisionnement,
                        COLUMNS.extractedApprovisionnement
                    ),
                    fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
                    fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
                ])
            if (!attachmentRow) return []

            const entreprises = byRowId(entrepriseRows)
            const ressources = byRowId(ressourceRows)

            return rows
                .filter((row) => row.Document === attachmentRow.id)
                .map((row) => {
                    const id = asNumber(row.id) ?? 0
                    const entreprise = entreprises.get(
                        asNumber(row.Fournisseur) ?? 0
                    )
                    const ressource = ressources.get(
                        asNumber(row.Ressource) ?? 0
                    )

                    return {
                        id,
                        state: stateOf(row.Etat),
                        extractedAt:
                            asDate(row.Date_d_extraction) ?? new Date(0),
                        read: {
                            document: attachment.name,
                            excelRow: asNumber(row.Ligne_Excel) ?? 0,
                            supplier: asString(row.Document_fournisseur),
                            resource: asString(row.Document_ressource),
                            tonnage: Number(asString(row.Document_tonnage)),
                            rawProvenance: asString(
                                row.Document_repartition_par_provenance
                            ),
                            additionalData: asString(
                                row.Document_donnees_additionnelles
                            ),
                        },
                        derived: {
                            parsedProvenance: parseProvenance(
                                row.Repartition_par_provenance,
                                id
                            ),
                            matchedFournisseur: entreprise
                                ? toEntreprise(entreprise)
                                : null,
                            matchedRessource: ressource
                                ? toRessource(ressource)
                                : null,
                        },
                    }
                })
                .sort((a, b) => a.read.excelRow - b.read.excelRow)
        },

        async create(
            attachment: Pick<Attachment, 'id'>,
            lines: readonly ExtractedLine[],
            extractedAt: Date
        ): Promise<void> {
            await gristReady()

            const [attachmentRow, entrepriseRows, ressourceRows] =
                await Promise.all([
                    findAttachmentRow(attachment.id),
                    fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
                    fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
                ])
            if (!attachmentRow) {
                throw new Error(
                    `No "${TABLE.attachment}" row holds the attachment ${attachment.id}.`
                )
            }

            const entrepriseIdBySiret = new Map(
                entrepriseRows.map((row) => [
                    toEntreprise(row).siret,
                    asNumber(row.id) ?? 0,
                ])
            )
            const ressourceIdByCode = new Map(
                ressourceRows.map((row) => [
                    toRessource(row).code,
                    asNumber(row.id) ?? 0,
                ])
            )

            // A Ref pointing at nothing is written 0.
            await createRows(
                TABLE.extractedApprovisionnement,
                lines.map(({ read, derived }) => ({
                    Etat: NOT_IMPORTED,
                    Document: asNumber(attachmentRow.id) ?? 0,
                    Plan_d_approvisionnement:
                        asNumber(attachmentRow.Plan_d_approvisionnement) ?? 0,
                    Ligne_Excel: read.excelRow,
                    Date_d_extraction: extractedAt.getTime() / 1000,
                    Document_fournisseur: read.supplier,
                    Document_ressource: read.resource,
                    Document_tonnage: String(read.tonnage),
                    Document_repartition_par_provenance: read.rawProvenance,
                    Document_donnees_additionnelles: read.additionalData,
                    Fournisseur: derived.matchedFournisseur
                        ? (entrepriseIdBySiret.get(
                              derived.matchedFournisseur.siret
                          ) ?? 0)
                        : 0,
                    Ressource: derived.matchedRessource
                        ? (ressourceIdByCode.get(
                              derived.matchedRessource.code
                          ) ?? 0)
                        : 0,
                    Repartition_par_provenance: JSON.stringify(
                        derived.parsedProvenance
                    ),
                }))
            )
        },

        async update(
            id: number,
            changes: {
                matchedFournisseur?: Entreprise | null
                matchedRessource?: Ressource | null
                parsedProvenance?: ProvenanceParseResults
            }
        ): Promise<void> {
            await gristReady()

            const [entrepriseRows, ressourceRows] = await Promise.all([
                fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
                fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
            ])

            const fields: Record<string, number | string> = {}
            if (changes.matchedFournisseur !== undefined) {
                const { matchedFournisseur } = changes
                fields.Fournisseur = matchedFournisseur
                    ? (asNumber(
                          entrepriseRows.find(
                              (row) =>
                                  toEntreprise(row).siret ===
                                  matchedFournisseur.siret
                          )?.id
                      ) ?? 0)
                    : 0
            }
            if (changes.matchedRessource !== undefined) {
                const { matchedRessource } = changes
                fields.Ressource = matchedRessource
                    ? (asNumber(
                          ressourceRows.find(
                              (row) =>
                                  toRessource(row).code ===
                                  matchedRessource.code
                          )?.id
                      ) ?? 0)
                    : 0
            }

            if (changes.parsedProvenance !== undefined) {
                fields.Repartition_par_provenance = JSON.stringify(
                    changes.parsedProvenance
                )
            }

            await updateRow(TABLE.extractedApprovisionnement, id, fields)
        },

        async markAsImported(id: number): Promise<void> {
            await gristReady()
            await updateRow(TABLE.extractedApprovisionnement, id, {
                Etat: IMPORTED,
            })
        },
    }
}
