import type { Installation } from '@shared/core/domain/entities/installation'
import type { UsageType } from '@shared/core/domain/value-objects/usage'

export type PlanDApprovisionnement = {
    id: number
    nom: string
    installation: Installation['id']
    typeDePlan: string
    usage: UsageType | null
    natureDonnee: string
    statut: string
}
