import './PlanHeader.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import type { SelectablePlan } from '../ScreenSelectPlan'

const UNKNOWN = 'Inconnu'

export type PlanHeaderProps = {
    plan: SelectablePlan
    // Left out while importing: the plan cannot change then.
    onChangePlan?: () => void
}

export default function PlanHeader({ plan, onChangePlan }: PlanHeaderProps) {
    const entries = [
        { label: 'Type de plan', value: plan.typeDePlan },
        {
            label: 'Appel à projet',
            value: plan.appelsAProjet.join(', ') || UNKNOWN,
        },
        { label: 'Statut', value: plan.statut },
    ]

    return (
        <header className="plan-header">
            <div className="plan-header__text">
                <h1 className="fr-h6 fr-m-0">{plan.nom}</h1>
                <dl className="fr-text--xs fr-m-0 plan-header__entries">
                    {entries.map(({ label, value }) => (
                        <div key={label} className="plan-header__entry">
                            <dt>{label} :</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            {onChangePlan && (
                <button
                    type="button"
                    className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-arrow-left-right-line"
                    onClick={onChangePlan}
                >
                    Changer de plan
                </button>
            )}
        </header>
    )
}
