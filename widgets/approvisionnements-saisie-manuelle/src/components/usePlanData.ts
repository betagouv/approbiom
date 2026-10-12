import { useState } from 'react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { EditableFields } from '../approvisionnement-form'

export type PlanDataSources = {
    approvisionnements: readonly Approvisionnement[]
    entreprises: readonly Entreprise[]
    createApprovisionnements: (
        approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
    ) => Promise<Approvisionnement['id'][]>
    updateApprovisionnement: (
        id: Approvisionnement['id'],
        approvisionnement: Partial<Approvisionnement>
    ) => Promise<void>
    deleteApprovisionnement: (id: Approvisionnement['id']) => Promise<void>
    createEntreprise: (entreprise: Entreprise) => Promise<void>
}

export function usePlanData({
    approvisionnements: initialApprovisionnements,
    entreprises: initialEntreprises,
    createApprovisionnements,
    updateApprovisionnement,
    deleteApprovisionnement,
    createEntreprise,
}: PlanDataSources) {
    const [approvisionnements, setApprovisionnements] = useState(
        initialApprovisionnements
    )
    const [entreprises, setEntreprises] = useState(initialEntreprises)

    return {
        approvisionnements,
        entreprises,

        create: async (
            planDApprovisionnement: Approvisionnement['planDApprovisionnement'],
            fields: EditableFields
        ) => {
            const approvisionnement = { planDApprovisionnement, ...fields }
            const [id] = await createApprovisionnements([approvisionnement])
            setApprovisionnements((previous) => [
                ...previous,
                { ...approvisionnement, id },
            ])
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

        addEntreprise: async (entreprise: Entreprise) => {
            await createEntreprise(entreprise)
            setEntreprises((previous) => [...previous, entreprise])
        },
    }
}
