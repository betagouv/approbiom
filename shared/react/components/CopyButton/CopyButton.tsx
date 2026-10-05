import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useEffect, useState } from 'react'
import type { CopyButtonProps } from './CopyButton.types'

type CopyState = 'idle' | 'copied' | 'failed'

const LABELS: Record<CopyState, string> = {
    idle: 'Copier',
    copied: 'Copié',
    failed: 'Copie impossible',
}

// How long « Copié » stays before the button reads « Copier » again.
const RESET_AFTER_MS = 2000

export default function CopyButton({ value, label }: CopyButtonProps) {
    const [state, setState] = useState<CopyState>('idle')

    useEffect(() => {
        if (state === 'idle') return

        const timer = setTimeout(() => setState('idle'), RESET_AFTER_MS)
        return () => clearTimeout(timer)
    }, [state])

    function copy() {
        navigator.clipboard
            .writeText(value)
            .then(() => setState('copied'))
            .catch(() => setState('failed'))
    }

    const icon =
        state === 'copied' ? 'fr-icon-check-line' : 'fr-icon-clipboard-line'

    return (
        <>
            <button
                type="button"
                className={`fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left ${icon}`}
                onClick={copy}
            >
                {LABELS[state]}
                {label && (
                    <>
                        {' '}
                        <span className="fr-sr-only">{label}</span>
                    </>
                )}
            </button>
            <span className="fr-sr-only" role="status">
                {state === 'copied' &&
                    `${label ?? 'Valeur'} copié dans le presse-papiers`}
                {state === 'failed' && 'La copie a échoué'}
            </span>
        </>
    )
}
