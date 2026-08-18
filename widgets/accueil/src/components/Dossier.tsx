import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import './Dossier.css'
import FilInstruction from './FilInstruction'
import PiecesJointes from './PiecesJointes'
import TabNav, {
    type TabNavItem,
} from '@shared/user-interface/component/TabNav'
import Ressource, {
    type RessourceScreen,
} from '@shared/user-interface/screen/ressource'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import {
    getAppelsAProjet,
    type PlanDetail,
} from '@shared/core/application/services/plan-detail'
import { useState } from 'react'

const SECTIONS: readonly TabNavItem[] = [
    { id: 'fil-instruction', label: 'Fil d’instruction' },
    { id: 'ressources', label: 'Ressources' },
    { id: 'pieces-jointes', label: 'Pièces jointes' },
]
const INCONNU = '—'

export type DossierProps = {
    plan: PlanDetail
    ressource: RessourceScreen
    getFileUrl: (id: Attachment['id']) => Promise<string>
    onClose: () => void
}

export default function Dossier({
    plan,
    ressource,
    getFileUrl,
    onClose,
}: DossierProps) {
    const [section, setSection] = useState(SECTIONS[0].id)

    const appelsAProjet = getAppelsAProjet(plan).join(', ')

    return (
        <div className="dossier">
            <div className="dossier__header">
                <button
                    type="button"
                    className="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-arrow-left-line dossier__back"
                    onClick={onClose}
                >
                    Accueil
                </button>
                <div className="dossier__heading">
                    <h1 className="fr-h3 dossier__title">{plan.nom}</h1>

                    <dl className="dossier__meta">
                        <div className="dossier__meta-entry">
                            <dt>Appel à projet</dt>
                            <dd>{appelsAProjet || INCONNU}</dd>
                        </div>
                        <div className="dossier__meta-entry">
                            <dt>Région de l&apos;installation</dt>
                            <dd>{plan.installationRegion ?? INCONNU}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <TabNav
                label="Sections du dossier"
                items={SECTIONS}
                currentId={section}
                onSelect={setSection}
            />

            {section === 'fil-instruction' && (
                <FilInstruction demandes={plan.demandesSubvention} />
            )}

            {section === 'ressources' && (
                <Ressource {...ressource} plan={plan.id} />
            )}
            {section === 'pieces-jointes' && (
                <PiecesJointes
                    attachments={plan.attachments}
                    getFileUrl={getFileUrl}
                />
            )}
        </div>
    )
}
