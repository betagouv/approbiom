import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import Alert from '@shared/react/components/Alert'

import { useCallback, useState } from 'react'

export type ImportAttachment = (
    attachment: Pick<Attachment, 'id' | 'name' | 'planDApprovisionnement'>
) => Promise<void>

export type ImportProps = {
    selectedAttachment: Pick<
        Attachment,
        'id' | 'planDApprovisionnement' | 'type' | 'name'
    >
    importAttachment: ImportAttachment
}

function Import({ selectedAttachment, importAttachment }: ImportProps) {
    const [error, setError] = useState<Error | undefined>()

    const handleImportAction = useCallback(async () => {
        setError(undefined)

        try {
            await importAttachment(selectedAttachment)
        } catch (cause) {
            setError(cause instanceof Error ? cause : new Error(String(cause)))
        }
    }, [importAttachment, selectedAttachment])

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
        </>
    )
}

export default Import
