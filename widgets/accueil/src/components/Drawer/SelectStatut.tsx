import Alert from '@shared/components/Alert'
import { RadioGroup, type RadioOption } from '@shared/components/Radio'
import type { PlanStatus } from '@shared/domain/plan-d-approvisionnement'
import { updatePlanStatus } from '@shared/use-cases/updatePlanStatus'

import { useState } from 'react'

type StatusValue = PlanStatus | 'undefined'

const ERRORS = {
    save: {
        title: 'Enregistrement impossible',
        message:
            'Erreur : le statut n’a pas pu être enregistré. Réessayez dans un instant.',
    },
    refresh: {
        title: 'Affichage non actualisé',
        message:
            'Erreur : le statut a bien été enregistré, mais l’affichage n’a pas pu être actualisé. Rechargez la page pour le voir.',
    },
}

type StatusError = keyof typeof ERRORS

const STATUT_OPTIONS: readonly RadioOption<StatusValue>[] = [
    { label: 'En fonctionnement', value: 'en fonctionnement' },
    { label: 'Obsolète', value: 'obsolète' },
    { label: 'Projet', value: 'projet' },
    { label: 'Abandonné', value: 'abandonné' },
    { label: 'Indéfini', value: 'undefined' },
]

function fromStatusToValue(status: string | null): StatusValue {
    switch (status?.toLowerCase()) {
        case 'en fonctionnement':
            return 'en fonctionnement'
        case 'obsolète':
            return 'obsolète'
        case 'projet':
            return 'projet'
        case 'abandonné':
            return 'abandonné'
        default:
            return 'undefined'
    }
}

export type SelectStatutProps = {
    planId: number
    statut: string | null
    onRefetchPlan: () => Promise<void>
}

export default function SelectStatut({
    planId,
    statut,
    onRefetchPlan,
}: SelectStatutProps) {
    const [error, setError] = useState<StatusError | null>(null)

    async function onStatusChange(value: StatusValue) {
        const formattedValue = value === 'undefined' ? null : value
        setError(null)

        try {
            await updatePlanStatus({ planId, status: formattedValue })
        } catch (cause) {
            console.error('Failed to update plan status:', cause)
            setError('save')
            return
        }

        try {
            await onRefetchPlan()
        } catch (cause) {
            console.error('Failed to read the plan back:', cause)
            setError('refresh')
        }
    }

    return (
        <>
            <RadioGroup
                options={STATUT_OPTIONS}
                value={fromStatusToValue(statut)}
                onChange={(value) => void onStatusChange(value)}
                legend="Statut du plan d'approvisionnement"
                description="Sélectionnez le statut actuel du plan d'approvisionnement."
            />

            {error && (
                <Alert severity="error" title={ERRORS[error].title}>
                    {ERRORS[error].message}
                </Alert>
            )}
        </>
    )
}
