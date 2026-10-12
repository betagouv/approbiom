import { useState } from 'react'
import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import { ExtractedLinesNotDeletedError } from '@shared/core/application/services/import-extracted-approvisionnements'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { EditableFields } from '../approvisionnement-form'

export type PlanDataSources = {
    approvisionnements: readonly Approvisionnement[]
    entreprises: readonly Entreprise[]
    pays: readonly Pays[]
    extractions: readonly ExtractionSummary[]
    createApprovisionnements: (
        approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
    ) => Promise<Approvisionnement['id'][]>
    updateApprovisionnement: (
        id: Approvisionnement['id'],
        approvisionnement: Partial<Approvisionnement>
    ) => Promise<void>
    deleteApprovisionnement: (id: Approvisionnement['id']) => Promise<void>
    createEntreprise: (entreprise: Entreprise) => Promise<void>
    createPays: (pays: Pays) => Promise<void>
    listExtractions: () => Promise<readonly ExtractionSummary[]>
    importExtractedApprovisionnements: (
        lines: readonly ExtractedApprovisionnement[],
        plan: Approvisionnement['planDApprovisionnement'],
        source: Attachment['id']
    ) => Promise<Approvisionnement[]>
}

export function usePlanData({
    approvisionnements: initialApprovisionnements,
    entreprises: initialEntreprises,
    pays: initialPays,
    extractions: initialExtractions,
    createApprovisionnements,
    updateApprovisionnement,
    deleteApprovisionnement,
    createEntreprise,
    createPays,
    listExtractions,
    importExtractedApprovisionnements,
}: PlanDataSources) {
    const [approvisionnements, setApprovisionnements] = useState(
        initialApprovisionnements
    )
    const [entreprises, setEntreprises] = useState(initialEntreprises)
    const [pays, setPays] = useState(initialPays)
    const [extractions, setExtractions] = useState(initialExtractions)

    const add = (created: readonly Approvisionnement[]) =>
        setApprovisionnements((previous) => [...previous, ...created])

    return {
        approvisionnements,
        entreprises,
        pays,
        extractions,

        refreshExtractions: () => {
            listExtractions().then(setExtractions, () => {})
        },

        create: async (
            planDApprovisionnement: Approvisionnement['planDApprovisionnement'],
            fields: EditableFields
        ) => {
            const approvisionnement = { planDApprovisionnement, ...fields }
            const [id] = await createApprovisionnements([approvisionnement])
            add([{ ...approvisionnement, id }])
        },

        update: async (
            id: Approvisionnement['id'],
            changes: Partial<Approvisionnement>
        ) => {
            await updateApprovisionnement(id, changes)
            setApprovisionnements((previous) =>
                previous.map((approvisionnement) =>
                    approvisionnement.id === id
                        ? { ...approvisionnement, ...changes }
                        : approvisionnement
                )
            )
        },

        remove: async (id: Approvisionnement['id']) => {
            await deleteApprovisionnement(id)
            setApprovisionnements((previous) =>
                previous.filter(
                    (approvisionnement) => approvisionnement.id !== id
                )
            )
        },

        importLines: async (
            lines: readonly ExtractedApprovisionnement[],
            plan: Approvisionnement['planDApprovisionnement'],
            source: Attachment['id']
        ) => {
            try {
                const created = await importExtractedApprovisionnements(
                    lines,
                    plan,
                    source
                )
                add(created)

                return created
            } catch (error) {
                if (error instanceof ExtractedLinesNotDeletedError)
                    add(error.created)

                throw error
            }
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
