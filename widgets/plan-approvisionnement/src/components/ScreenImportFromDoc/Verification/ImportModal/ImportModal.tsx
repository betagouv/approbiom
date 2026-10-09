import './ImportModal.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Modal from '@shared/react/components/Modal'

const plural = (count: number, word: string) =>
    `${count} ${word}${count > 1 ? 's' : ''}`

export type ImportModalProps = {
    lineCount: number
    approvisionnementCount: number
    // Leaves the modal open, with the reason, when it fails.
    onConfirm: () => Promise<void>
    onClose: () => void
}

export default function ImportModal({
    lineCount,
    approvisionnementCount,
    onConfirm,
    onClose,
}: ImportModalProps) {
    const [importing, setImporting] = useState(false)
    const [failure, setFailure] = useState<string | null>(null)

    async function confirm() {
        setImporting(true)
        setFailure(null)
        try {
            await onConfirm()
        } catch (error) {
            setFailure(
                error instanceof Error
                    ? error.message
                    : "L'import a échoué. Aucun approvisionnement n'a été créé. Réessayez."
            )
            setImporting(false)
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={'Importer les lignes vérifiées ?'}
            titleIcon="fr-icon-warning-line"
            actions={
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-icon-download-line"
                            disabled={importing}
                            onClick={() => void confirm()}
                        >
                            Importer{' '}
                            {plural(
                                approvisionnementCount,
                                'approvisionnement'
                            )}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-btn--secondary"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </li>
                </ul>
            }
        >
            {failure && (
                <Alert severity="error" size="sm">
                    {failure}
                </Alert>
            )}
            <p className="fr-text--md">
                Attention : {plural(lineCount, 'ligne')} du document{' '}
                {lineCount > 1 ? 'vont' : 'va'} créer{' '}
                {plural(approvisionnementCount, 'approvisionnement')} dans la
                table Approvisionnement de ce plan.
            </p>
            <p className="fr-text--sm fr-m-0 import-modal__mention">
                Les approvisionnements créés pourront ensuite être modifiés ou
                supprimés depuis la page du plan.
            </p>
        </Modal>
    )
}
