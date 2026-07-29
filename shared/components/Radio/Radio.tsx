import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/radio/radio.main.min.css'

import { useId } from 'react'
import type { RadioProps } from './Radio.types'

export default function Radio({
    name,
    label,
    description,
    value,
    checked,
    disabled,
    size = 'md',
    onChange,
}: RadioProps) {
    const inputId = useId()

    const className = ['fr-radio-group', size === 'sm' && 'fr-radio-group--sm']
        .filter(Boolean)
        .join(' ')

    return (
        <div className={className}>
            <input
                type="radio"
                id={inputId}
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
            />
            <label className="fr-label" htmlFor={inputId}>
                {label}
                {description && (
                    <span className="fr-hint-text">{description}</span>
                )}
            </label>
        </div>
    )
}
