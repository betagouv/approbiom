import { describe, expect, it } from 'vitest'
import type { DemandeSubvention } from '@shared/application/domain/demande-subvention'
import type { Instruction } from '@shared/application/domain/instruction'
import type { ProgrammeAide } from '@shared/application/domain/programme-aide'
import {
    getInstructionsByProgrammeAide,
    type FilInstructionData,
} from './instructions-by-programme-aide'

function programmeAide(overrides: Partial<ProgrammeAide> = {}): ProgrammeAide {
    return {
        id: 1,
        year: 2023,
        name: 'Biomasse Chaleur Industrie Agriculture Tertiaire',
        shortName: 'BCIAT',
        appelAProjet: 'BCIAT (2023)',
        ...overrides,
    }
}

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

const bciat = programmeAide()
const bcib = programmeAide({ id: 2, shortName: 'BCIB' })

const demandeBciat: DemandeSubvention = {
    id: 1,
    programmeAide: bciat.id,
    planDApprovisionnement: 1,
}

const demandeBcib: DemandeSubvention = {
    id: 2,
    programmeAide: bcib.id,
    planDApprovisionnement: 1,
}

// Same programme, another dossier.
const demandeVoisine: DemandeSubvention = {
    id: 3,
    programmeAide: bciat.id,
    planDApprovisionnement: 2,
}

const nouvelleAquitaine = instruction()
const occitanie = instruction({ crb: 'Occitanie', name: 'Instruction 2' })
const bretagne = instruction({
    crb: 'Bretagne',
    name: 'Instruction 3',
    subvention: 2,
})
const voisine = instruction({
    crb: 'Grand Est',
    name: 'Instruction 4',
    subvention: 3,
})

function data(overrides: Partial<FilInstructionData> = {}): FilInstructionData {
    return {
        demandesSubvention: [demandeBciat, demandeBcib, demandeVoisine],
        programmesAide: [bciat, bcib],
        instructions: [nouvelleAquitaine, occitanie, bretagne, voisine],
        ...overrides,
    }
}

describe('getInstructionsByProgrammeAide', () => {
    it('opens one block per programme the dossier answered', () => {
        expect(
            getInstructionsByProgrammeAide(data(), 1).map(
                ({ programmeAide }) => programmeAide.shortName
            )
        ).toEqual(['BCIAT', 'BCIB'])
    })

    it('gathers the instructions of each demande under its programme', () => {
        const [premier, second] = getInstructionsByProgrammeAide(data(), 1)

        expect(premier.instructions).toEqual([nouvelleAquitaine, occitanie])
        expect(second.instructions).toEqual([bretagne])
    })

    it('leaves out the demandes of every other dossier', () => {
        const blocks = getInstructionsByProgrammeAide(data(), 1)

        expect(
            blocks.flatMap(({ instructions }) => instructions)
        ).not.toContain(voisine)
    })

    it('reads nothing into a dossier that carries no demande', () => {
        expect(getInstructionsByProgrammeAide(data(), 3)).toEqual([])
    })

    it('merges two demandes filed under the same programme', () => {
        const secondeDemande: DemandeSubvention = {
            id: 4,
            programmeAide: bciat.id,
            planDApprovisionnement: 1,
        }

        const blocks = getInstructionsByProgrammeAide(
            data({
                demandesSubvention: [demandeBciat, secondeDemande],
                instructions: [
                    nouvelleAquitaine,
                    instruction({
                        crb: 'Occitanie',
                        name: 'Instruction 5',
                        subvention: 4,
                    }),
                ],
            }),
            1
        )

        expect(blocks).toHaveLength(1)
        expect(blocks[0].instructions.map(({ crb }) => crb)).toEqual([
            'Nouvelle Aquitaine',
            'Occitanie',
        ])
    })

    it('leaves out a demande whose programme cannot be named', () => {
        expect(
            getInstructionsByProgrammeAide(data({ programmesAide: [bcib] }), 1)
        ).toHaveLength(1)
    })

    it('never groups instructions on an unresolved demande', () => {
        const orpheline = instruction({ crb: 'Corse', subvention: 0 })
        const orpheline2 = instruction({ crb: 'Normandie', subvention: 0 })

        const blocks = getInstructionsByProgrammeAide(
            data({
                demandesSubvention: [{ ...demandeBciat, id: 0 }],
                instructions: [orpheline, orpheline2],
            }),
            1
        )

        expect(blocks[0].instructions).toEqual([])
    })
})
