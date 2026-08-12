import type { Crb } from './crb'
import type { DemandeSubvention } from './demande-subvention'

export type Instruction = {
    crb: Crb['name']
    subvention: DemandeSubvention['id']
    name: string
    avisCrbRequis: boolean
    dateSaisineCrb: Date | null
    dateAvisCrb: Date | null
    avisCRB: AvisCRB
    dateAvisPrefet: Date | null
    avisPrefet: AvisPrefet
    phase: PhaseInstruction
}

export const AVIS_CRB = [
    'Avis favorable',
    'Avis favorable avec réserves',
    'Avis réservé',
    'En attente',
    'Non demandé',
    'Avis défavorable',
] as const

export type AvisCRB = (typeof AVIS_CRB)[number]

export function isAvisCRB(value: unknown): value is AvisCRB {
    return AVIS_CRB.includes(value as AvisCRB)
}

export const AVIS_PREFET = [
    'Avis favorable',
    'Avis favorable avec réserves',
    'Avis réservé',
    'En attente',
    'Avis défavorable',
] as const

export type AvisPrefet = (typeof AVIS_PREFET)[number]

export function isAvisPrefet(value: unknown): value is AvisPrefet {
    return AVIS_PREFET.includes(value as AvisPrefet)
}

export const PHASES_INSTRUCTION = [
    'Aucun avis CRB requis',
    'Avis préfet en attente',
    "En cours d'instruction",
    'Avis préfet rendu',
] as const

export type PhaseInstruction = (typeof PHASES_INSTRUCTION)[number]

export function isPhaseInstruction(value: unknown): value is PhaseInstruction {
    return PHASES_INSTRUCTION.includes(value as PhaseInstruction)
}
