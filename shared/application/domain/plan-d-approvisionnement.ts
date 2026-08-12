import type { Installation } from './installation'

export type PlanDApprovisionnement = {
    id: number
    nom: string
    installation: Installation['id']
    typeDePlan: string
    usage: UsageType | null
    natureDonnee: string
    statut: string
}

export const USAGE_TYPES = [
    'énergie',
    'matériau',
    'chimie',
    'carburant',
] as const

export type UsageType = (typeof USAGE_TYPES)[number]

export function isUsageType(value: unknown): value is UsageType {
    return USAGE_TYPES.includes(value as UsageType)
}

export type Usage = {
    libelle: string
    category: UsageType
}
