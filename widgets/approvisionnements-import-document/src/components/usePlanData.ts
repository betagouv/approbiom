import { useState } from 'react'
import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'

export type PlanDataSources = {
    entreprises: readonly Entreprise[]
    pays: readonly Pays[]
    extractions: readonly ExtractionSummary[]
    imported: ReadonlyMap<Attachment['id'], number>
    createEntreprise: (entreprise: Entreprise) => Promise<void>
    listExtractions: () => Promise<readonly ExtractionSummary[]>
    countImported: () => Promise<ReadonlyMap<Attachment['id'], number>>
}

export function usePlanData({
    entreprises: initialEntreprises,
    pays,
    extractions: initialExtractions,
    imported: initialImported,
    createEntreprise,
    listExtractions,
    countImported,
}: PlanDataSources) {
    const [entreprises, setEntreprises] = useState(initialEntreprises)
    const [extractions, setExtractions] = useState(initialExtractions)
    const [imported, setImported] = useState(initialImported)

    return {
        entreprises,
        pays,
        extractions,
        imported,

        refreshExtractions: () => {
            listExtractions().then(setExtractions, () => {})
        },

        refreshImported: () => {
            countImported().then(setImported, () => {})
        },

        addEntreprise: async (entreprise: Entreprise) => {
            await createEntreprise(entreprise)
            setEntreprises((previous) => [...previous, entreprise])
        },
    }
}
