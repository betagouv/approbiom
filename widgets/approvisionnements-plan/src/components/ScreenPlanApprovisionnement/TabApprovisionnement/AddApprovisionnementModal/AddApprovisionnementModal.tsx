import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import { useState } from 'react'
import Modal from '@shared/react/components/Modal'
import { RadioGroup } from '@shared/react/components/Radio'

type Way = 'manual' | 'document'

export type AddApprovisionnementModalProps = {
    hasAttachments: boolean
    onManual: () => void
    onDocument?: () => void
    onClose: () => void
}

export default function AddApprovisionnementModal({
    hasAttachments,
    onManual,
    onDocument,
    onClose,
}: AddApprovisionnementModalProps) {
    const [way, setWay] = useState<Way | null>(null)

    return (
        <Modal
            open
            onClose={onClose}
            title="Ajouter des approvisionnements"
            actions={
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-right">
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-icon-arrow-right-line"
                            disabled={way === null}
                            onClick={way === 'document' ? onDocument : onManual}
                        >
                            Continuer
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
            <RadioGroup
                legend={'Comment voulez-vous les ajouter\u00a0?'}
                options={[
                    {
                        value: 'manual',
                        label: 'Saisie manuelle',
                        description:
                            'Créez un approvisionnement en renseignant fournisseur, ressource, provenance et tonnage.',
                    },
                    {
                        value: 'document',
                        label: "À partir d'un document BCIB/BCIAT",
                        description: hasAttachments
                            ? 'Extrayez les lignes du document joint au plan, vérifiez-les une à une, puis importez-les.'
                            : "Aucune pièce jointe n'est liée à ce plan.",
                        disabled: !hasAttachments || !onDocument,
                    },
                ]}
                value={way}
                onChange={setWay}
            />
        </Modal>
    )
}
