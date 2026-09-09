import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { ExtractedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'
import Alert from '@shared/react/components/Alert'

import { useCallback, useState } from 'react'

export type ImportProps = {
    selectedAttachment: Pick<
        Attachment,
        'id' | 'planDApprovisionnement' | 'type' | 'name'
    >
    getTransformedImportData: (
        selectedAttachment: Pick<Attachment, 'id' | 'name'>
    ) => Promise<readonly ExtractedLines[]>
}

function Import({ selectedAttachment, getTransformedImportData }: ImportProps) {
    const [importedData, setImportedData] = useState<
        readonly ExtractedLines[] | undefined
    >()
    const [error, setError] = useState<Error | undefined>()

    const handleImportAction = useCallback(async () => {
        setError(undefined)
        setImportedData(undefined)

        try {
            setImportedData(await getTransformedImportData(selectedAttachment))
        } catch (cause) {
            setError(cause instanceof Error ? cause : new Error(String(cause)))
        }
    }, [getTransformedImportData, selectedAttachment])

    return (
        <>
            <p>
                Pièce jointe sélectionnée&nbsp;:{' '}
                <strong>{selectedAttachment.name}</strong> (
                {selectedAttachment.type})
            </p>
            {error !== undefined && (
                <Alert severity="error">
                    L&apos;import de <strong>{selectedAttachment.name}</strong>{' '}
                    a échoué&nbsp;: {error.message}
                </Alert>
            )}
            <button
                className="fr-btn"
                type="button"
                onClick={() => void handleImportAction()}
            >
                Importer la pièce jointe
            </button>
            {importedData !== undefined &&
                (importedData.length === 0 ? (
                    <Alert severity="warning">
                        Aucune ligne n&apos;a été trouvée dans la feuille
                        «&nbsp;Fournisseurs&nbsp;».
                    </Alert>
                ) : (
                    <p>{JSON.stringify(importedData)}</p>
                ))}
        </>
    )
}

export default Import
