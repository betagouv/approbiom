import type {
    ExtractedApprovisionnementPort,
    ExtractedLineChanges,
} from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type {
    ExtractedApprovisionnement,
    ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'
import { VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import { gristReady } from '../../helpers/grist-ready'
import {
    asDate,
    asIdList,
    asNumber,
    byRowId,
    createRows,
    deleteRows,
    fetchRowsOnce,
    updateRow,
    type GristRow,
} from '../../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../../types/grist-tables'
import { toEntreprise } from '../grist-adapter-entreprise'
import { toRessource } from '../grist-adapter-ressource'
import {
    toChangedFields,
    toControle,
    toExtractedApprovisionnement,
    toExtractedApprovisionnementRow,
    toFields,
    type References,
} from './utils'

// The table points at the Piece_jointe row, not at the attachment itself.
async function findAttachmentRow(
    attachmentId: Attachment['id']
): Promise<GristRow | undefined> {
    const rows = await fetchRowsOnce(TABLE.attachment, COLUMNS.attachment)

    return rows.find((row) => asIdList(row.piece_jointe).includes(attachmentId))
}

const fetchExtractedApprovisionnementRows = async () =>
    (
        await fetchRowsOnce(
            TABLE.extractedApprovisionnement,
            COLUMNS.extractedApprovisionnement
        )
    ).map(toExtractedApprovisionnementRow)

async function fetchReferences(): Promise<References> {
    const [entrepriseRows, ressourceRows] = await Promise.all([
        fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
        fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
    ])

    return {
        entrepriseIdBySiret: new Map(
            entrepriseRows.map((row) => [
                toEntreprise(row).siret,
                asNumber(row.id) ?? 0,
            ])
        ),
        ressourceIdByCode: new Map(
            ressourceRows.map((row) => [
                toRessource(row).code,
                asNumber(row.id) ?? 0,
            ])
        ),
    }
}

export function createGristExtractedApprovisionnementAdapter(): ExtractedApprovisionnementPort {
    return {
        async listByDocument(
            attachment: Pick<Attachment, 'id' | 'name'>
        ): Promise<ExtractedApprovisionnement[]> {
            await gristReady()

            const [attachmentRow, rows, entrepriseRows, ressourceRows] =
                await Promise.all([
                    findAttachmentRow(attachment.id),
                    fetchExtractedApprovisionnementRows(),
                    fetchRowsOnce(TABLE.entreprise, COLUMNS.entreprise),
                    fetchRowsOnce(TABLE.metaRessource, COLUMNS.metaRessource),
                ])
            if (!attachmentRow) return []

            const entreprises = byRowId(entrepriseRows)
            const ressources = byRowId(ressourceRows)

            return rows
                .filter((row) => row.Document === attachmentRow.id)
                .map((row) => {
                    const entreprise = entreprises.get(row.Fournisseur)
                    const ressource = ressources.get(row.Ressource)

                    return toExtractedApprovisionnement(
                        row,
                        attachment.name,
                        entreprise && toEntreprise(entreprise),
                        ressource && toRessource(ressource)
                    )
                })
                .sort((a, b) => a.read.excelRow - b.read.excelRow)
        },

        async listSummaries() {
            await gristReady()

            const [attachmentRows, rows] = await Promise.all([
                fetchRowsOnce(TABLE.attachment, COLUMNS.attachment),
                fetchExtractedApprovisionnementRows(),
            ])

            return attachmentRows.flatMap((attachmentRow) => {
                const lines = rows.filter(
                    (row) => row.Document === attachmentRow.id
                )
                const summary = {
                    extractedAt:
                        lines.length === 0
                            ? null
                            : asDate(lines[0].Date_d_extraction),
                    lineCount: lines.length,
                    verifiedCount: lines.filter(
                        (row) => toControle(row.Controle) === VERIFIEE
                    ).length,
                }

                return asIdList(attachmentRow.piece_jointe).map(
                    (attachmentId) => ({ attachmentId, ...summary })
                )
            })
        },

        async create(
            attachment: Pick<Attachment, 'id'>,
            lines: readonly ExtractedLine[],
            extractedAt: Date
        ): Promise<void> {
            await gristReady()

            const [attachmentRow, references] = await Promise.all([
                findAttachmentRow(attachment.id),
                fetchReferences(),
            ])
            if (!attachmentRow) {
                throw new Error(
                    `No "${TABLE.attachment}" row holds the attachment ${attachment.id}.`
                )
            }

            const document = {
                Document: asNumber(attachmentRow.id) ?? 0,
                Plan_d_approvisionnement:
                    asNumber(attachmentRow.Plan_d_approvisionnement) ?? 0,
            }
            await createRows(
                TABLE.extractedApprovisionnement,
                lines.map((line) =>
                    toFields(line, document, extractedAt, references)
                )
            )
        },

        async update(
            id: ExtractedApprovisionnement['id'],
            changes: ExtractedLineChanges
        ): Promise<void> {
            await gristReady()

            await updateRow(
                TABLE.extractedApprovisionnement,
                id,
                toChangedFields(changes, await fetchReferences())
            )
        },

        async deleteByDocument(attachment: Pick<Attachment, 'id'>) {
            await gristReady()

            const [attachmentRow, rows] = await Promise.all([
                findAttachmentRow(attachment.id),
                fetchExtractedApprovisionnementRows(),
            ])
            if (!attachmentRow) return

            const ids = rows
                .filter((row) => row.Document === attachmentRow.id)
                .map(({ id }) => id)
            if (ids.length > 0)
                await deleteRows(TABLE.extractedApprovisionnement, ids)
        },

        async deleteLines(ids: readonly ExtractedApprovisionnement['id'][]) {
            await gristReady()

            if (ids.length > 0)
                await deleteRows(TABLE.extractedApprovisionnement, ids)
        },
    }
}
