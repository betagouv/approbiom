import type { Attachment } from '@shared/core/domain/entities/attachment'

import { gristReady } from '@shared/infrastructure/grist/grist-ready'
import AsyncGate from '@shared/react/AsyncGate'
import Alert from '@shared/react/components/Alert'
import { useAsyncState } from '@shared/react/UseAsyncState'
import { useEffect, useState } from 'react'
import Import from './components/Import'
import {
    isGristAttachmentRecord,
    type GristAttachmentRecord,
} from '@shared/infrastructure/grist/grist-on-record-attachment'

import type { AttachmentPort } from '@shared/core/application/ports/attachment'

const getTransformedImportDataFromFile = () =>
    Promise.reject(
        new Error("la transformation des données n'est pas encore implémentée")
    )

type WidgetImportProps = {
    attachments: Pick<AttachmentPort, 'findOne'>
}

export default function App({ attachments }: WidgetImportProps) {
    const state = useAsyncState(() => gristReady())

    const [attachment, setAttachment] = useState<Attachment | undefined>()
    const [error, setError] = useState<Error | undefined>()

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
                                getTransformedImportDataFromFile={
                                    getTransformedImportDataFromFile
                                }
                            />
                        )}
                    </>
                )}
            </AsyncGate>
        </main>
    )
}
