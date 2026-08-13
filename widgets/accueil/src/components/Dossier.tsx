import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import './Dossier.css'
import FilInstruction from './FilInstruction'
import TabNav, {
    type TabNavItem,
} from '@shared/user-interface/component/TabNav'
import Ressource, {
    type RessourceScreen,
} from '@shared/user-interface/screen/ressource'
import {
    getInstructionsByProgrammeAide,
    type FilInstructionData,
} from '@shared/application/read-models/instructions-by-programme-aide'
import type { PlanAccueil } from '@shared/application/read-models/plan-accueil'
import { useMemo, useState } from 'react'

const SECTIONS: readonly TabNavItem[] = [
    { id: 'fil-instruction', label: 'Fil d’instruction' },
    { id: 'ressources', label: 'Ressources' },
]
const INCONNU = '—'

export type DossierProps = {
    plan: PlanAccueil
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

    const appelsAProjet = programmes
        .map(({ programmeAide }) => programmeAide.appelAProjet)
        .filter((appel) => appel !== '')
        .join(', ')

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
                <FilInstruction programmes={programmes} />
            )}

            {section === 'ressources' && (
                <Ressource {...ressource} plan={plan.id} />
            )}
        </div>
    )
}
