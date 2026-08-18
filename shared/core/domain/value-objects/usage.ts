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
