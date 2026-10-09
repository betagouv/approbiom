import './DeleteApprovisionnementModal.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Modal from '@shared/react/components/Modal'
import type { ApprovisionnementRow } from '../../../../approvisionnement-rows'
import { FOURNISSEUR_NOT_GIVEN } from '../../../../constant'
import { formatNumber } from '@shared/react/format'

export type DeleteApprovisionnementModalProps = {
    row: ApprovisionnementRow
    onConfirm: () => Promise<void>
    onClose: () => void
}

export default function DeleteApprovisionnementModal({
    row,
    onConfirm,
    onClose,
}: DeleteApprovisionnementModalProps) {
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

    const entries = [
        {
            label: 'Fournisseur',
            value: row.fournisseur ?? FOURNISSEUR_NOT_GIVEN,
        },
        { label: 'Ressource', value: row.ressource },
        {
            label: 'Provenance · tonnage',
            value: `${row.provenance} · ${formatNumber(row.tonnage)} t MV/an`,
        },
    ]

    return (
        <Modal
            open
            onClose={onClose}
            title={'Supprimer cet approvisionnement\u00a0?'}
            actions={
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-icon-delete-line"
                            disabled={deleting}
                            onClick={() => void confirm()}
                        >
                            Supprimer
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
            <div className="delete-approvisionnement">
                {failed && (
                    <Alert severity="error" size="sm">
                        La suppression a échoué. L&apos;approvisionnement est
                        toujours dans le plan. Réessayez.
                    </Alert>
                )}
                <dl className="delete-approvisionnement__recap">
                    {entries.map(({ label, value }) => (
                        <div key={label}>
                            <dt className="fr-text--xs fr-m-0 delete-approvisionnement__label">
                                {label}
                            </dt>
                            <dd className="fr-text--sm fr-m-0">{value}</dd>
                        </div>
                    ))}
                </dl>
                <p className="fr-text--sm fr-m-0">
                    La ligne sera retirée de la table Approvisionnement. Cette
                    action est définitive.
                </p>
            </div>
        </Modal>
    )
}
