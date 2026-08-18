import { describe, expect, it } from 'vitest'
import {
    getEtapes,
    type Etape,
    type EtapeId,
    type Instruction,
} from '@shared/core/domain/entities/instruction'
import { PHASES_INSTRUCTION } from '@shared/core/domain/value-objects/phase-instruction'

function instruction(overrides: Partial<Instruction> = {}): Instruction {
    return {
        crb: 'Nouvelle Aquitaine',
        subvention: 1,
        name: 'Instruction 1',
        avisCrbRequis: true,
        dateSaisineCrb: null,
        dateAvisCrb: null,
        avisCRB: 'En attente',
        dateAvisPrefet: null,
        avisPrefet: 'En attente',
        phase: "En cours d'instruction",
        ...overrides,
    }
}

const states = (etapes: readonly Etape[]): Record<string, string> =>
    Object.fromEntries(etapes.map((etape) => [etape.id, etape.state]))

const etape = (etapes: readonly Etape[], id: EtapeId): Etape =>
    etapes.find((candidate) => candidate.id === id) as Etape

describe('getEtapes', () => {
    it('lays out the steps of an instruction, in order', () => {
        expect(getEtapes(instruction()).map((etape) => etape.id)).toEqual([
            'saisine-crb',
            'avis-crb',
            'avis-prefet',
        ])
    })

    it('waits on the CRB while the instruction is under way', () => {
        const etapes = getEtapes(
            instruction({
                phase: "En cours d'instruction",
                dateSaisineCrb: new Date('2026-03-15'),
            })
        )

        expect(states(etapes)).toEqual({
            'saisine-crb': 'done',
            'avis-crb': 'current',
            'avis-prefet': 'pending',
        })
    })

    it('waits on the préfet once the CRB has given its avis', () => {
        const etapes = getEtapes(
            instruction({
                phase: 'Avis préfet en attente',
                dateSaisineCrb: new Date('2026-03-15'),
                dateAvisCrb: new Date('2026-08-05'),
            })
        )

        expect(states(etapes)).toEqual({
            'saisine-crb': 'done',
            'avis-crb': 'done',
            'avis-prefet': 'current',
        })
    })

    it('leaves no step in progress once the préfet has answered', () => {
        const etapes = getEtapes(
            instruction({
                phase: 'Avis préfet rendu',
                dateAvisCrb: new Date('2026-08-05'),
                dateAvisPrefet: new Date('2026-09-01'),
            })
        )

        expect(states(etapes)).toEqual({
            'saisine-crb': 'done',
            'avis-crb': 'done',
            'avis-prefet': 'done',
        })
    })

    it('marks the first step that is not behind us, whatever the phase', () => {
        for (const phase of PHASES_INSTRUCTION) {
            const etapes = getEtapes(instruction({ phase }))
            const behind = etapes.filter(({ state }) => state === 'done').length

            // The step just past the ones behind us is the one in progress —
            // and there is none left to be in once they all are.
            expect(etapes[behind]?.state).toBe(
                behind === etapes.length ? undefined : 'current'
            )
        }
    })

    it('skips the CRB steps when no CRB opinion was required', () => {
        const etapes = getEtapes(
            instruction({
                avisCrbRequis: false,
                phase: 'Aucun avis CRB requis',
                avisCRB: 'Non demandé',
            })
        )

        expect(states(etapes)).toEqual({
            'saisine-crb': 'skipped',
            'avis-crb': 'skipped',
            'avis-prefet': 'pending',
        })
    })

    it('carries the dates the instruction holds', () => {
        const saisine = new Date('2026-03-15')
        const avis = new Date('2026-08-05')

        const etapes = getEtapes(
            instruction({ dateSaisineCrb: saisine, dateAvisCrb: avis })
        )

        expect(etape(etapes, 'saisine-crb').date).toBe(saisine)
        expect(etape(etapes, 'avis-crb').date).toBe(avis)
        expect(etape(etapes, 'avis-prefet').date).toBeNull()
    })

    it('tags a step with its avis, once there is one to show', () => {
        const etapes = getEtapes(
            instruction({
                avisCRB: 'Avis favorable',
                avisPrefet: 'En attente',
            })
        )

        expect(etape(etapes, 'avis-crb').avis).toBe('Avis favorable')
        // « En attente » is the absence of an avis, not one worth a tag.
        expect(etape(etapes, 'avis-prefet').avis).toBeNull()
        expect(etape(etapes, 'saisine-crb').avis).toBeNull()
    })
})
