import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { ATTACHMENT_TYPE_IMPORT } from '@shared/core/domain/value-objects/attachment-type'
import Alert from '@shared/react/components/Alert'
import { useCallback, useMemo, useState } from 'react'

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

    const isCorrectAttachmentType: boolean =
        selectedAttachment?.type === ATTACHMENT_TYPE_IMPORT
    const isDisabledImportButton: boolean = useMemo(
        () => !isCorrectAttachmentType,
        [isCorrectAttachmentType]
    )

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
                    Une erreur est survenue pendant l&apos;import du fichier
                    {selectedAttachment?.name}&nbsp;:&nbsp;{error.message}.
                </Alert>
            )}
            {isCorrectAttachmentType === false && (
                <Alert severity="warning">
                    Le type de la pièce jointe sélectionnée est incorrect.
                    Veuillez sélectionner une pièce jointe de type &quot;
                    {ATTACHMENT_TYPE_IMPORT}&quot;.
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
                disabled={isDisabledImportButton}
            >
                Importer la pièce jointe
            </button>
        </>
    )
}

export default Import
