import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import Alert from '@shared/react/components/Alert'
import { useCallback, useState } from 'react'

export type ImportProps = {
    selectedAttachment: Pick<
        Attachment,
        'id' | 'planDApprovisionnement' | 'type' | 'name'
    >
    getTransformedImportDataFromFile: (
        id: Attachment['id']
    ) => Promise<string[]>
}

function Import({
    selectedAttachment,
    getTransformedImportDataFromFile,
}: ImportProps) {
    const [transformedDataResult, setTransformedDataResult] = useState<
        string[] | undefined
    >()
    const [error, setError] = useState<Error | undefined>()

    const handleImportAction = useCallback(async () => {
        if (!selectedAttachment?.id) return
        try {
            const result = await getTransformedImportDataFromFile(
                selectedAttachment.id
            )
            setTransformedDataResult(result)
        } catch (cause) {
            setError(cause instanceof Error ? cause : new Error(String(cause)))
        }
    }, [getTransformedImportDataFromFile, selectedAttachment])

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
            {transformedDataResult !== undefined && (
                <>
                    <p>Données transformées trouvées&nbsp;:&nbsp;</p>
                    {JSON.stringify(transformedDataResult)}
                </>
            )}
            <button
                className="fr-btn"
                type="button"
                onClick={() => void handleImportAction()}
            >
                Importer la pièce jointe
            </button>
        </>
    )
}

export default Import
