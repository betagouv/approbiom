import { useState } from 'react'
import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'

export type PlanDataSources = {
    entreprises: readonly Entreprise[]
    pays: readonly Pays[]
    extractions: readonly ExtractionSummary[]
    createEntreprise: (entreprise: Entreprise) => Promise<void>
    createPays: (pays: Pays) => Promise<void>
    listExtractions: () => Promise<readonly ExtractionSummary[]>
}

export function usePlanData({
    entreprises: initialEntreprises,
    pays: initialPays,
    extractions: initialExtractions,
    createEntreprise,
    createPays,
    listExtractions,
}: PlanDataSources) {
    const [entreprises, setEntreprises] = useState(initialEntreprises)
    const [pays, setPays] = useState(initialPays)
    const [extractions, setExtractions] = useState(initialExtractions)

    return {
        entreprises,
        pays,
        extractions,

        refreshExtractions: () => {
            listExtractions().then(setExtractions, () => {})
        },

        addEntreprise: async (entreprise: Entreprise) => {
            await createEntreprise(entreprise)
            setEntreprises((previous) => [...previous, entreprise])
        },

        addPays: async (created: Pays) => {
            await createPays(created)
            setPays((previous) => [...previous, created])
        },
    }
}
