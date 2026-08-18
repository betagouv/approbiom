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
