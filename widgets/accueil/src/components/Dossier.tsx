import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import './Dossier.css'
import FilInstruction from './FilInstruction'
import TabNav, { type TabNavItem } from '@shared/components/TabNav'
import Ressource, { type RessourceScreen } from '@shared/screens/ressource'
import type { Plan } from '@shared/application/read-models/plan'
import {
    getInstructionsByProgrammeAide,
    type FilInstructionData,
} from '@shared/application/read-models/instructions-by-programme-aide'
import { useMemo, useState } from 'react'

const SECTIONS: readonly TabNavItem[] = [
    { id: 'fil-instruction', label: 'Fil d’instruction' },
    { id: 'ressources', label: 'Ressources' },
]

export type DossierProps = {
    plan: Plan
    ressource: RessourceScreen
    filInstruction: FilInstructionData
    onClose: () => void
}

export default function Dossier({
    plan,
    ressource,
    filInstruction,
    onClose,
}: DossierProps) {
    const [section, setSection] = useState(SECTIONS[0].id)

    // Everything is loaded for every dossier; which chronologies belong to
    // this one is settled here, once, rather than on every tab change.
    const programmes = useMemo(
        () => getInstructionsByProgrammeAide(filInstruction, plan.id),
        [filInstruction, plan.id]
    )

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

            {section === 'fil-instruction' && (
                <FilInstruction programmes={programmes} />
            )}

            {section === 'ressources' && (
                <Ressource {...ressource} plan={plan.id} />
            )}
        </div>
    )
}
