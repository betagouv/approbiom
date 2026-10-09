import './ReextractModal.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Modal from '@shared/react/components/Modal'
import type { Attachment } from '@shared/core/domain/entities/attachment'

export type ReextractModalProps = {
    attachment: Attachment
    // Drops the lines extracted; the modal stays open when it fails.
    onConfirm: () => Promise<void>
    onClose: () => void
}

export default function ReextractModal({
    attachment,
    onConfirm,
    onClose,
}: ReextractModalProps) {
    const [deleting, setDeleting] = useState(false)
    const [failed, setFailed] = useState(false)

    async function confirm() {
        setDeleting(true)
        setFailed(false)
        try {
            await onConfirm()
        } catch {
            setFailed(true)
            setDeleting(false)
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={"Relancer l'extraction ?"}
            titleIcon="fr-icon-warning-line"
            actions={
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-icon-refresh-line"
                            disabled={deleting}
                            onClick={() => void confirm()}
                        >
                            Relancer l&apos;extraction
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
            {failed && (
                <Alert severity="error" size="sm">
                    Les lignes extraites n&apos;ont pas pu être remplacées.
                    Réessayez.
                </Alert>
            )}
            <p className="fr-text--md">
                Les lignes extraites de « {attachment.name} » et leur
                vérification seront remplacées par une nouvelle extraction.
            </p>
            <p className="fr-text--sm fr-m-0 reextract-modal__mention">
                Les approvisionnements déjà importés dans le plan ne sont pas
                modifiés.
            </p>
        </Modal>
    )
}
