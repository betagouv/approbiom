import type { Attachment } from '@shared/core/domain/entities/attachment'

import { gristReady } from '@shared/infrastructure/grist/grist-ready'
import AsyncGate from '@shared/react/components/AsyncGate'
import Alert from '@shared/react/components/Alert'
import { useAsyncState } from '@shared/react/UseAsyncState'
import { useCallback, useEffect, useState } from 'react'
import Import, { type ImportAttachment } from './components/Import'
import {
    isGristAttachmentRecord,
    type GristAttachmentRecord,
} from '@shared/infrastructure/grist/grist-on-record-attachment'

import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { ApprovisionnementAImporterAdapter } from '@shared/infrastructure/grist/adapters/grist-adapter-a-importer-approvisionnement'

import { importRows } from '@shared/infrastructure/import-bcib-bciat/importRows'

type WidgetImportProps = {
    attachments: Pick<AttachmentPort, 'findOne' | 'getFileUrl'>
    approvisionnementsAImporter: ApprovisionnementAImporterAdapter
}

export default function App({
    attachments,
    approvisionnementsAImporter,
}: WidgetImportProps) {
    const state = useAsyncState(() => gristReady())

    const [attachment, setAttachment] = useState<Attachment | undefined>()
    const [error, setError] = useState<Error | undefined>()

    const importAttachment: ImportAttachment = useCallback(
        async ({ id, name, planDApprovisionnement }) => {
            // The attachment adapter reads an empty plan Ref as 0.
            if (!planDApprovisionnement) {
                throw new Error(
                    "aucun plan d'approvisionnement n'est lié à cette pièce jointe"
                )
            }

            const response = await fetch(await attachments.getFileUrl(id))

            if (!response.ok) {
                throw new Error(
                    `le téléchargement du fichier a échoué (${response.status} ${response.statusText})`
                )
            }

            const file = await response.blob()

            try {
                const lines = await importRows(file, name)

                await approvisionnementsAImporter.create(
                    lines.map((line) => ({ ...line, planDApprovisionnement }))
                )
            } catch (cause) {
                throw new Error(
                    `Un problème est survenu : ${
                        cause instanceof Error ? cause.message : String(cause)
                    }`,
                    { cause }
                )
            }
        },
        [attachments, approvisionnementsAImporter]
    )

    useEffect(() => {
        grist.onRecord((record) => {
            setError(undefined)
            setAttachment(undefined)

            if (!isGristAttachmentRecord(record)) {
                setError(
                    new Error(
                        "Les colonnes de la table Pièce Jointe demandées par le custom widget n'ont pas été trouvées ou n'ont pas le type attendu."
                    )
                )
                return
            }

            const row: GristAttachmentRecord = record

            if (row.piece_jointe === null || row.piece_jointe.length === 0) {
                setError(
                    new Error('Cette ligne ne contient aucune pièce jointe.')
                )
                return
            }

            const id = row.piece_jointe[0]

            void attachments
                .findOne(id)
                .then(setAttachment, (cause: unknown) => {
                    setError(
                        new Error(
                            `La pièce jointe sélectionnée n'a pas pu être lue : ${
                                cause instanceof Error
                                    ? cause.message
                                    : String(cause)
                            }`
                        )
                    )
                })
        })
    }, [attachments])

    return (
        <main className="app">
            <AsyncGate state={state}>
                {() => (
                    <>
                        {(error !== undefined || attachment === undefined) && (
                            <Alert severity="error">{error?.message}</Alert>
                        )}
                        {attachment !== undefined && (
                            <Import
                                selectedAttachment={attachment}
                                importAttachment={importAttachment}
                            />
                        )}
                    </>
                )}
            </AsyncGate>
        </main>
    )
}
