import { describe, expect, it } from 'vitest'
import type {
    DemandeSubventionDetail,
    InstructionDetail,
    PlanDetail,
} from '@shared/core/application/services/plan-detail'
import {
    getCommuneDeSituationLabel,
    getCrbOptions,
    getCrbsInstructeurs,
    getDepartementOptions,
    getFilteredRows,
    getStatutOptions,
    getUsageOptions,
    SANS_CRB_LABEL,
    SANS_CRB_VALUE,
} from './utils'

function plan(overrides: Partial<PlanDetail> = {}): PlanDetail {
    return {
        id: 1,
        nom: 'Plan',
        installation: 1,
        typeDePlan: 'création',
        usage: 'énergie',
        natureDonnee: 'prévision',
        statut: 'projet',
        createdBy: null,
        createdAt: null,
        installationNom: null,
        communeDeSituation: null,
        departementDeSituation: null,
        installationRegion: null,
        demandesSubvention: [],
        fournisseurs: [],
        ...overrides,
    }
}

let demandeId = 0

function demande(appelAProjet: string): DemandeSubventionDetail {
    demandeId += 1

    return {
        id: demandeId,
        programmeAide: {
            id: demandeId,
            year: 2023,
            name: `Programme ${appelAProjet}`,
            shortName: appelAProjet,
            appelAProjet,
            laureat: null,
        },
        instructions: [],
    }
}

const valFleuri = plan({
    id: 1,
    nom: 'RCU Val Fleuri',
    statut: 'projet',
    departementDeSituation: '87',
    installationRegion: 'Nouvelle-Aquitaine',
    demandesSubvention: [demande('BCIAT (2023)')],
})
const boisDuNord = plan({
    id: 2,
    nom: 'Chaufferie Bois du Nord',
    statut: 'en fonctionnement',
    departementDeSituation: '33',
    installationRegion: 'Nouvelle-Aquitaine',
    demandesSubvention: [demande('BCIAT (2023)'), demande('BCIB (2024)')],
})
const clairVillage = plan({
    id: 3,
    nom: 'RCU Clair-Village',
    statut: 'obsolète',
})

const plans = [valFleuri, boisDuNord, clairVillage]

describe('getFilteredRows', () => {
    it('returns every row when nothing is asked of it', () => {
        expect(getFilteredRows(plans)).toEqual(plans)
        expect(getFilteredRows(plans, {})).toEqual(plans)
        expect(getFilteredRows(plans, { nom: '', statuts: [] })).toEqual(plans)
    })

    it('matches a name anywhere in it, whatever the case', () => {
        expect(getFilteredRows(plans, { nom: 'rcu' })).toEqual([
            valFleuri,
            clairVillage,
        ])
        expect(getFilteredRows(plans, { nom: 'BOIS' })).toEqual([boisDuNord])
    })

    it('matches a name whatever the accents, on either side', () => {
        const chaudiere = plan({ id: 4, nom: 'Chaudière RCU Les Prés' })

        expect(
            getFilteredRows([...plans, chaudiere], { nom: 'Chaudiere rcu' })
        ).toEqual([chaudiere])
        expect(
            getFilteredRows([...plans, chaudiere], { nom: 'CHAUDIÈRE' })
        ).toEqual([chaudiere])
        expect(getFilteredRows(plans, { nom: 'clair-villagé' })).toEqual([
            clairVillage,
        ])
    })

    it('trims the query before matching', () => {
        expect(getFilteredRows(plans, { nom: '  val fleuri  ' })).toEqual([
            valFleuri,
        ])
    })

    it('returns nothing when no name matches', () => {
        expect(getFilteredRows(plans, { nom: 'introuvable' })).toEqual([])
    })

    it('keeps the rows in the order they were given', () => {
        expect(
            getFilteredRows(plans, { statuts: ['obsolète', 'projet'] })
        ).toEqual([valFleuri, clairVillage])
    })

    it('keeps the plans whose usage principal is selected', () => {
        const chimie = plan({ id: 4, nom: 'Bioraffinerie', usage: 'chimie' })
        const sansUsage = plan({ id: 5, nom: 'Sans usage', usage: null })

        expect(
            getFilteredRows([...plans, chimie, sansUsage], {
                usages: ['chimie'],
            })
        ).toEqual([chimie])
    })

    it('hands back the very rows it was given, not copies', () => {
        expect(getFilteredRows(plans, { nom: 'val' })[0]).toBe(valFleuri)
    })

    it('does not touch the array it was given', () => {
        const given = [...plans]
        getFilteredRows(plans, { nom: 'rcu', statuts: ['projet'] })
        expect(plans).toEqual(given)
    })

    it('keeps the plans sitting in a département that was picked', () => {
        expect(getFilteredRows(plans, { departements: ['87'] })).toEqual([
            valFleuri,
        ])
        expect(getFilteredRows(plans, { departements: ['87', '33'] })).toEqual([
            valFleuri,
            boisDuNord,
        ])
    })

    it('leaves out a plan that sits nowhere, once a département is picked', () => {
        expect(getFilteredRows(plans, { departements: ['33'] })).toEqual([
            boisDuNord,
        ])
    })

    it('keeps every plan while no département is picked, placed or not', () => {
        expect(getFilteredRows(plans, {})).toEqual(plans)
    })

    it('narrows on every criterion at once', () => {
        expect(
            getFilteredRows(plans, { nom: 'rcu', statuts: ['projet'] })
        ).toEqual([valFleuri])
        // Each one matches something, but no row matches both.
        expect(
            getFilteredRows(plans, { nom: 'bois', statuts: ['projet'] })
        ).toEqual([])
    })
})

describe('getDepartementOptions', () => {
    it('groups the départements under their région, régions sorted in French', () => {
        expect(
            getDepartementOptions([
                {
                    region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                    departements: [
                        { dep: '87', libelle: 'Haute-Vienne' },
                        { dep: '33', libelle: 'Gironde' },
                    ],
                },
                {
                    // Sorts under I, not after Z.
                    region: { reg: '11', libelle: 'Île-de-France' },
                    departements: [{ dep: '75', libelle: 'Paris' }],
                },
            ])
        ).toEqual([
            {
                id: '11',
                label: 'Île-de-France',
                options: [{ value: '75', label: '75' }],
            },
            {
                id: '75',
                label: 'Nouvelle-Aquitaine',
                options: [
                    { value: '87', label: '87' },
                    { value: '33', label: '33' },
                ],
            },
        ])
    })

    it('does not reorder the array it was given', () => {
        const given = [
            {
                region: { reg: '75', libelle: 'Nouvelle-Aquitaine' },
                departements: [],
            },
            {
                region: { reg: '11', libelle: 'Île-de-France' },
                departements: [],
            },
        ]
        getDepartementOptions(given)

        expect(given[0].region.libelle).toBe('Nouvelle-Aquitaine')
    })
})

describe('getStatutOptions', () => {
    it('offers each statut once, capitalised and in alphabetical order', () => {
        expect(getStatutOptions([...plans, plan({ id: 4 })])).toEqual([
            { value: 'en fonctionnement', label: 'En fonctionnement' },
            { value: 'obsolète', label: 'Obsolète' },
            { value: 'projet', label: 'Projet' },
        ])
    })

    it('drops a statut the document left empty', () => {
        expect(getStatutOptions([plan({ statut: '' })])).toEqual([])
    })
})

describe('getUsageOptions', () => {
    it('offers each usage once, capitalised and in alphabetical order', () => {
        expect(
            getUsageOptions([
                plan({ id: 1, usage: 'matériau' }),
                plan({ id: 2, usage: 'énergie' }),
                plan({ id: 3, usage: 'chimie' }),
                plan({ id: 4, usage: 'énergie' }),
            ])
        ).toEqual([
            { value: 'chimie', label: 'Chimie' },
            { value: 'énergie', label: 'Énergie' },
            { value: 'matériau', label: 'Matériau' },
        ])
    })

    it('drops the plans with no usage principal', () => {
        expect(getUsageOptions([plan({ usage: null })])).toEqual([])
    })
})

describe('getCommuneDeSituationLabel', () => {
    const getCommuneNom = (code: string) =>
        code === '87154' ? 'Saint-Junien' : undefined

    it('names the commune, followed by its code INSEE', () => {
        expect(
            getCommuneDeSituationLabel(
                plan({ communeDeSituation: '87154' }),
                getCommuneNom
            )
        ).toBe('Saint-Junien (87154)')
    })

    it('keeps the code alone when the référentiel cannot name it', () => {
        expect(
            getCommuneDeSituationLabel(
                plan({ communeDeSituation: '00000' }),
                getCommuneNom
            )
        ).toBe('00000')
    })

    it('gives nothing for a plan whose installation names no commune', () => {
        expect(getCommuneDeSituationLabel(plan(), getCommuneNom)).toBeNull()
    })
})

let instructionId = 0

function instruction(crb: number, crbName: string): InstructionDetail {
    instructionId += 1

    return {
        id: instructionId,
        crb,
        crbName,
        subvention: 1,
        name: `Instruction ${instructionId}`,
        avisCrbRequis: true,
        dateSaisineCrb: null,
        dateAvisCrb: null,
        avisCRB: 'En attente',
        dateAvisPrefet: null,
        avisPrefet: 'En attente',
        phase: "En cours d'instruction",
    }
}

function instruitPar(
    ...instructions: InstructionDetail[]
): DemandeSubventionDetail {
    return { ...demande('BCIAT (2023)'), instructions }
}

const occitanie = instruction(1, 'Occitanie')
const bretagne = instruction(2, 'Bretagne')

const planOccitanie = plan({
    id: 10,
    nom: 'Plan Occitanie',
    demandesSubvention: [instruitPar(occitanie)],
})
const planDeuxCrb = plan({
    id: 11,
    nom: 'Plan deux CRB',
    demandesSubvention: [
        instruitPar(bretagne, instruction(1, 'Occitanie')),
        instruitPar(instruction(2, 'Bretagne')),
    ],
})
const planSansCrb = plan({
    id: 12,
    nom: 'Plan sans CRB',
    demandesSubvention: [demande('BCIB (2024)')],
})
const crbPlans = [planOccitanie, planDeuxCrb, planSansCrb]

describe('getCrbsInstructeurs', () => {
    it('names each CRB once, however many instructions it holds', () => {
        expect(getCrbsInstructeurs(planDeuxCrb)).toEqual([
            { id: 2, name: 'Bretagne' },
            { id: 1, name: 'Occitanie' },
        ])
    })

    it('leaves out an instruction whose CRB is empty', () => {
        expect(
            getCrbsInstructeurs(
                plan({ demandesSubvention: [instruitPar(instruction(0, ''))] })
            )
        ).toEqual([])
    })
})

describe('getCrbOptions', () => {
    it('offers every CRB in French order, then the plans no CRB instructs', () => {
        expect(getCrbOptions(crbPlans)).toEqual([
            { value: 2, label: 'Bretagne' },
            { value: 1, label: 'Occitanie' },
            { value: SANS_CRB_VALUE, label: SANS_CRB_LABEL },
        ])
    })

    it('offers a CRB the document cannot name under its number', () => {
        expect(
            getCrbOptions([
                plan({ demandesSubvention: [instruitPar(instruction(7, ''))] }),
            ])[0]
        ).toEqual({ value: 7, label: 'CRB n°7' })
    })
})

describe('getFilteredRows, by CRB instructeur', () => {
    it('keeps the plans one of the picked CRB instructs', () => {
        expect(getFilteredRows(crbPlans, { crbs: [1] })).toEqual([
            planOccitanie,
            planDeuxCrb,
        ])
        expect(getFilteredRows(crbPlans, { crbs: [2] })).toEqual([planDeuxCrb])
    })

    it('keeps the plans no CRB instructs when that option is picked', () => {
        expect(getFilteredRows(crbPlans, { crbs: [SANS_CRB_VALUE] })).toEqual([
            planSansCrb,
        ])
        expect(
            getFilteredRows(crbPlans, { crbs: [2, SANS_CRB_VALUE] })
        ).toEqual([planDeuxCrb, planSansCrb])
    })

    it('keeps every plan while no CRB is picked', () => {
        expect(getFilteredRows(crbPlans, { crbs: [] })).toEqual(crbPlans)
    })
})
