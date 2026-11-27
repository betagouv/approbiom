import type { Crb } from '@shared/core/domain/entities/crb'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { AvisCRB } from '@shared/core/domain/value-objects/avis-crb'
import type { AvisPrefet } from '@shared/core/domain/value-objects/avis-prefet'
import type { PhaseInstruction } from '@shared/core/domain/value-objects/phase-instruction'

export type Instruction = {
    id: number
    crb: Crb['id']
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

const ETAPES = ['saisine-crb', 'avis-crb', 'avis-prefet'] as const

export type EtapeId = (typeof ETAPES)[number]

/** `skipped`: a CRB step when no CRB opinion was required. */
export type EtapeState = 'done' | 'current' | 'pending' | 'skipped'

export type Etape = {
    id: EtapeId
    date: Date | null
    avis: AvisCRB | AvisPrefet | null
    state: EtapeState
}

const ETAPE_DATES: Record<EtapeId, (instruction: Instruction) => Date | null> =
    {
        'saisine-crb': (instruction) => instruction.dateSaisineCrb,
        'avis-crb': (instruction) => instruction.dateAvisCrb,
        'avis-prefet': (instruction) => instruction.dateAvisPrefet,
    }

const ETAPE_BY_PHASE: Record<PhaseInstruction, EtapeId> = {
    'Aucun avis CRB requis': 'saisine-crb',
    "En cours d'instruction": 'saisine-crb',
    'Avis préfet en attente': 'avis-crb',
    'Avis préfet rendu': 'avis-prefet',
}

/** The two steps that only exist when a CRB opinion was asked for. */
const ETAPES_CRB: readonly EtapeId[] = ['saisine-crb', 'avis-crb']

function getEtapeCourante(instruction: Instruction): number {
    const fromPhase = ETAPES.indexOf(ETAPE_BY_PHASE[instruction.phase])

    return fromPhase + 1
}

/** « En attente » is the absence of an avis. */
function getAvis(
    instruction: Instruction,
    id: EtapeId
): AvisCRB | AvisPrefet | null {
    const avis =
        id === 'avis-crb'
            ? instruction.avisCRB
            : id === 'avis-prefet'
              ? instruction.avisPrefet
              : null

    return avis === null || avis === 'En attente' ? null : avis
}

function getState(
    id: EtapeId,
    index: number,
    courante: number,
    avisCrbRequis: boolean
): EtapeState {
    if (!avisCrbRequis && ETAPES_CRB.includes(id)) return 'skipped'

    if (index < courante) return 'done'
    if (index === courante) return 'current'
    return 'pending'
}

export function getEtapes(instruction: Instruction): readonly Etape[] {
    const courante = getEtapeCourante(instruction)

    return ETAPES.map((id, index) => ({
        id,
        date: ETAPE_DATES[id](instruction),
        avis: getAvis(instruction, id),
        state: getState(id, index, courante, instruction.avisCrbRequis),
    }))
}
