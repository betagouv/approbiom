// DSFR's interrupteur: a checkbox drawn as a switch. The `<input>` is a real
// checkbox that DSFR hides and repaints through the label's `::before` and
// `::after`, so everything about it — the role, the space bar, the focus ring —
// is the browser's rather than this component's.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/interrupteur
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/toggle/toggle.main.min.css'

import { useId } from 'react'
import type { ToggleProps } from './Toggle.types'

export default function Toggle({
    label,
    description,
    checked,
    onChange,
    disabled = false,
    labelLeft = false,
    showState = false,
}: ToggleProps) {
    const id = useId()
    const inputId = `${id}-toggle`
    const descriptionId = `${id}-description`

    const className = ['fr-toggle', labelLeft && 'fr-toggle--label-left']
        .filter(Boolean)
        .join(' ')

    return (
        <div className={className}>
            <input
                type="checkbox"
                className="fr-toggle__input"
                id={inputId}
                checked={checked}
                disabled={disabled}
                aria-describedby={description ? descriptionId : undefined}
                onChange={(event) => onChange(event.target.checked)}
            />
            {/* DSFR draws the state text out of these two attributes, and only
                when both are there — which is why they are set as a pair or not
                at all. `undefined` leaves the attribute off the element. */}
            <label
                className="fr-toggle__label"
                htmlFor={inputId}
                data-fr-checked-label={showState ? 'Activé' : undefined}
                data-fr-unchecked-label={showState ? 'Désactivé' : undefined}
            >
                {label}
            </label>
            {description && (
                <p className="fr-hint-text" id={descriptionId}>
                    {description}
                </p>
            )}
        </div>
    )
}
