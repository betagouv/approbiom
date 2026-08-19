import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import './Dossier.css'

import PiecesJointes from './tabs/PiecesJointes'
import TabNav, { type TabNavItem } from '@shared/react/components/TabNav'
import Ressource from '@shared/react/components/Ressource'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import {
    getAppelsAProjet,
    type PlanDetail,
} from '@shared/core/application/services/plan-detail'
import { useState } from 'react'
import type { ApprovisionnementByRessourceStats } from '@shared/core/application/services/approvisionnement-stats'
import FilInstruction from './tabs/FilInstruction/FilInstruction'

const TABS: readonly TabNavItem[] = [
    { id: 'fil-instruction', label: 'Fil d’instruction' },
    { id: 'ressources', label: 'Ressources' },
    { id: 'pieces-jointes', label: 'Pièces jointes' },
]
const INCONNU = '—'

export type DossierProps = {
    approvisionnementStatsByRessource: ApprovisionnementByRessourceStats
    plan: PlanDetail
    getFileUrl: (id: Attachment['id']) => Promise<string>
    onClose: () => void
}

export default function Dossier({
    plan,
    approvisionnementStatsByRessource,
    getFileUrl,
    onClose,
}: DossierProps) {
    const [tab, setTab] = useState(TABS[0].id)

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
                items={TABS}
                currentId={tab}
                onSelect={setTab}
            />

            {tab === 'fil-instruction' && (
                <FilInstruction demandes={plan.demandesSubvention} />
            )}

            {tab === 'ressources' && (
                <Ressource
                    approvisionnementStatsByRessource={
                        approvisionnementStatsByRessource
                    }
                />
            )}
            {tab === 'pieces-jointes' && (
                <PiecesJointes
                    attachments={plan.attachments}
                    getFileUrl={getFileUrl}
                />
            )}
        </div>
    )
}
