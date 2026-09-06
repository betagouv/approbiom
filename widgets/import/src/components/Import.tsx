import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import Alert from '@shared/react/components/Alert'
import { useCallback, useMemo, useState } from 'react'

export type ImportProps = {
    selectedAttachment?: Pick<
        Attachment,
        'id' | 'planDApprovisionnement' | 'type' | 'name'
    >
    downloadAttachmentFile: (id: Attachment['id']) => Promise<any>
    getTransformedImportDataFromFile: (file: any) => Promise<string[]>
}

const ATTACHMENT_TYPE_IMPORT = 'Excel Ademe'

function Import({
    selectedAttachment,
    downloadAttachmentFile,
    getTransformedImportDataFromFile,
}: ImportProps) {
    const [transformedDataResult, setTransformedDataResult] = useState<
        string[] | undefined
    >()
    const [error, setError] = useState()

    const isAttachementSelected = selectedAttachment !== undefined

    const isCorrectAttachmentType: boolean =
        selectedAttachment?.type == ATTACHMENT_TYPE_IMPORT ||
        !isAttachementSelected
    const isDisabledImportButton: boolean = useMemo(
        () => !(isAttachementSelected && isCorrectAttachmentType),
        [isAttachementSelected, isCorrectAttachmentType]
    )

    const handleImportAction = useCallback(async () => {
        if (!selectedAttachment?.id) return
        try {
            const file = await downloadAttachmentFile(selectedAttachment.id)
            const result = await getTransformedImportDataFromFile(file)
            setTransformedDataResult(result)
        } catch (e) {
            setError(e)
        }
    }, [
        downloadAttachmentFile,
        getTransformedImportDataFromFile,
        selectedAttachment,
    ])
    return (
        <>
            <button
                className="fr-btn"
                type="button"
                onClick={() => void handleImportAction}
                disabled={isDisabledImportButton}
            >
                Importer la pièce jointe {selectedAttachment?.id}
            </button>
            {error !== undefined && (
                <Alert severity="error">
                    Une erreur est survenue pendant l&apos;import du fichier
                    {selectedAttachment?.name}&nbsp;:&nbsp;{error}.
                </Alert>
            )}
            {isAttachementSelected === false && (
                <Alert severity="warning">
                    Aucune pièce jointe n&apos;a été sélectionnée.
                </Alert>
            )}
            {isCorrectAttachmentType === false && (
                <Alert severity="warning">
                    Le type de la pièce jointe sélectionnée est incorrect.
                    Veuillez sélectionner une pièce jointe de type{' '}
                    {ATTACHMENT_TYPE_IMPORT}.
                </Alert>
            )}
            {transformedDataResult !== undefined && (
                <>
                    <p>Données transformées trouvées&nbsp;:&nbsbp;</p>
                    {JSON.stringify(transformedDataResult)}
                </>
            )}
        </>
    )
}

export default Import
