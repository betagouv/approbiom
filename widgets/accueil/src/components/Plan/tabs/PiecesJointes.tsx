import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import './PiecesJointes.css'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import type { Attachment } from '@shared/core/domain/entities/attachment'

const TAILLE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const KO = 1024
const MO = KO * KO

function formatTaille(octets: number): string {
    if (octets < KO) return `${TAILLE.format(octets)} B`

    return octets < MO
        ? `${TAILLE.format(Math.round(octets / KO))} KB`
        : `${TAILLE.format(octets / MO)} MB`
}

function getColumns(
    onDownload: (attachment: Attachment) => void
): readonly Column<Attachment>[] {
    return [
        {
            id: 'nom',
            header: 'Nom du document',
            render: (attachment) => (
                <span className="pieces-jointes__nom">
                    <span
                        className="fr-icon-file-line"
                        aria-hidden="true"
                    ></span>
                    {attachment.name}
                </span>
            ),
            sortBy: (attachment) => attachment.name,
        },
        {
            id: 'categorie',
            header: 'Catégorie',
            render: (attachment) => attachment.type,
        },
        {
            id: 'taille',
            header: 'Taille',
            render: (attachment) => formatTaille(attachment.sizeInBytes),
            sortBy: (attachment) => attachment.sizeInBytes,
        },
        {
            id: 'actions',
            header: 'Actions',
            render: (attachment) => (
                <button
                    type="button"
                    className="fr-btn fr-btn--tertiary-no-outline fr-icon-download-line"
                    onClick={() => onDownload(attachment)}
                >
                    Télécharger {attachment.name}
                </button>
            ),
        },
    ]
}

export type PiecesJointesProps = {
    attachments: readonly Attachment[]
    getFileUrl: (id: Attachment['id']) => Promise<string>
}

export default function PiecesJointes({
    attachments,
    getFileUrl,
}: PiecesJointesProps) {
    async function download(attachment: Attachment) {
        const url = await getFileUrl(attachment.id)

        const link = document.createElement('a')
        link.href = url
        link.download = attachment.name
        link.click()
    }

    if (attachments.length === 0) {
        return (
            <p className="fr-text--sm">
                Aucune pièce jointe n’est rattachée à ce plan.
            </p>
        )
    }

    return (
        <div className="pieces-jointes">
            <DataTable
                caption="Pièces jointes du plan"
                rows={attachments}
                columns={getColumns((attachment) => void download(attachment))}
                bordered
            />
        </div>
    )
}
