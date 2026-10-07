import './ScreenSelectPlan.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import { useEffect, useRef } from 'react'
import Combobox, {
    type ComboboxHandle,
} from '@shared/react/components/Combobox'
import type { PlanView } from '@shared/core/application/services/plan-view'

export type SelectablePlan = Pick<
    PlanView,
    'id' | 'nom' | 'typeDePlan' | 'statut' | 'appelsAProjet'
>

export type ScreenSelectPlanProps = {
    plans: readonly SelectablePlan[]
    // The plan being worked on, when another one is looked for.
    current?: SelectablePlan
    onSelect: (id: SelectablePlan['id']) => void
    onCancel: () => void
}

export default function ScreenSelectPlan({
    plans,
    current,
    onSelect,
    onCancel,
}: ScreenSelectPlanProps) {
    const comboboxRef = useRef<ComboboxHandle>(null)

    // Coming from « Changer de plan »: the search is what comes next.
    useEffect(() => {
        if (current) comboboxRef.current?.focus()
    }, [current])

    return (
        <div className="screen-select-plan">
            <header className="screen-select-plan__header">
                <h1 className="fr-h5 fr-mb-0">
                    Approvisionnements d&apos;un plan
                </h1>
                <p className="fr-text--sm fr-m-0 screen-select-plan__mention">
                    Choisissez le plan sur lequel vous travaillez.
                </p>
            </header>

            <Combobox
                ref={comboboxRef}
                label="Plan d'approvisionnement"
                hint="Recherche sur le nom du plan"
                placeholder="Ex. chaufferie Tulle"
                options={plans.map(({ id, nom }) => ({
                    value: id,
                    label: nom,
                }))}
                value={null}
                onChange={(id) => {
                    if (id !== null) onSelect(id)
                }}
            />

            {current && (
                <div>
                    <button
                        type="button"
                        className="fr-link fr-link--sm fr-link--icon-left fr-icon-arrow-left-line"
                        onClick={onCancel}
                    >
                        Revenir au plan « {current.nom} »
                    </button>
                </div>
            )}
        </div>
    )
}
