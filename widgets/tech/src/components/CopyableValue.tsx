import { useEffect, useState } from 'react'

interface CopyableValueProps {
    label: string
    value: string
}

type CopyStatus = 'idle' | 'copied' | 'failed'

const FEEDBACK_DURATION_MS = 1500

export default function CopyableValue({ label, value }: CopyableValueProps) {
    const [status, setStatus] = useState<CopyStatus>('idle')

    useEffect(() => {
        if (status === 'idle') return
        const reset = setTimeout(() => setStatus('idle'), FEEDBACK_DURATION_MS)
        return () => clearTimeout(reset)
    }, [status])

    function copy() {
        void navigator.clipboard
            .writeText(value)
            .then(() => {
                setStatus('copied')
            })
            .catch((err) => {
                console.error(err)
                setStatus('failed')
            })
    }

    return (
        <div className="copyable-value fr-mb-1w">
            <span className="fr-text--bold">{label} :</span>
            <code className={status === 'copied' ? 'copy-flash' : undefined}>
                {value || 'Chargement…'}
            </code>
            <button
                key={status}
                className={`fr-btn fr-btn--sm fr-btn--tertiary copy-button copy-button--${status}`}
                type="button"
                onClick={copy}
                disabled={!value}
            >
                {status === 'copied' && '✓ Copié !'}
                {status === 'failed' && 'Échec de la copie'}
                {status === 'idle' && 'Copier'}
            </button>
        </div>
    )
}
