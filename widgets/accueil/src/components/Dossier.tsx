import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import './Dossier.css'
import TabNav, { type TabNavItem } from '@shared/components/TabNav'
import Ressource, { type RessourceScreen } from '@shared/screens/ressource'
import type { Plan } from '@shared/application/read-models/plan'
import { useState } from 'react'

const SECTIONS: readonly TabNavItem[] = [
    { id: 'fil-instruction', label: 'Fil d’instruction' },
    { id: 'ressources', label: 'Ressources' },
]

export type DossierProps = {
    plan: Plan
    ressource: RessourceScreen
    onClose: () => void
}

export default function Dossier({ plan, ressource, onClose }: DossierProps) {
    const [section, setSection] = useState(SECTIONS[0].id)

    return (
        <div className="dossier">
            <button
                type="button"
                className="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-arrow-left-line dossier__back"
                onClick={onClose}
            >
                Accueil
            </button>

            <h1 className="fr-h3 dossier__title">{plan.nom}</h1>

            <TabNav
                label="Sections du dossier"
                items={SECTIONS}
                currentId={section}
                onSelect={setSection}
            />

            {section === 'ressources' && (
                <Ressource {...ressource} plan={plan.id} />
            )}
        </div>
    )
}
