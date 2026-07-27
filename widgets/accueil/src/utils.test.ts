import { describe, expect, it } from 'vitest'
import type { Plan_d_approvisionnement } from '@shared/grist/approbiom/tables'
import type { InstructionCrbAccueil } from './grist'
import {
    formatDate,
    getDerniereEtapeFaite,
    getDemandesSubventionByPlanId,
    getFilteredRows,
    getPhasesInstruction,
    getResultCountLabel,
    isLaureat,
} from './utils'

function planWith(
    row: Partial<Plan_d_approvisionnement>
): Plan_d_approvisionnement {
    return {
        Nom: 'Plan',
        Statut: 'projet',
        Departement_de_situation: 'Poitiers (86)',
        Appel_a_projet: 'CHALEUR+ (2024)',
        Type_de_plan: 'création',
        Usage_principal: 'énergie',
        Mise_en_service_projet: '2025',
        Nature_Donnee: 'prévision',
        id: 1,
        id_pa: 1,
        Installation: 1,
        Installation_Nom: 'Plan',
        Mise_en_service_Projet_raw: null,
        MES_Reel: null,
        Derniere_mise_a_jour: null,
        Commentaire: '',
        Voir_la_fiche: '',
        est_Laureat: 'non',
        CRB_competentes: 'Nouvelle-Aquitaine',
        demande_subvention: null,
        Voir_les_ressources: '',
        ...row,
    }
}

const valFleuri = planWith({
    id: 1,
    id_pa: 1,
    Nom: 'RCU Val-Fleuri 1',
    Statut: 'projet',
    Departement_de_situation: 'Poitiers (86)',
    Appel_a_projet: 'CHALEUR+ (2024)',
})
const belOrme = planWith({
    id: 2,
    id_pa: 2,
    Nom: 'Chaufferie de Bel-Orme',
    Statut: 'abandonné',
    Departement_de_situation: 'Guéret (23)',
    Appel_a_projet: 'GRANULÉS NA (2023)',
})
const plaineSud = planWith({
    id: 3,
    id_pa: 3,
    Nom: 'PLAINE-SUD phase 1',
    Statut: 'projet',
    Departement_de_situation: 'Poitiers (86)',
    Appel_a_projet: '',
})

const plans: readonly Plan_d_approvisionnement[] = [
    valFleuri,
    belOrme,
    plaineSud,
]

describe('getFilteredRows', () => {
    describe('on nom', () => {
        it('keeps the rows whose name contains the query', () => {
            expect(getFilteredRows(plans, { nom: 'Bel-Orme' })).toEqual([
                belOrme,
            ])
        })

        it('matches anywhere in the name, not only at its start', () => {
            expect(getFilteredRows(plans, { nom: 'Val-Fleuri' })).toEqual([
                valFleuri,
            ])
        })

        it('ignores case on the query', () => {
            expect(getFilteredRows(plans, { nom: 'rcu' })).toEqual([valFleuri])
        })

        it('ignores case on the name', () => {
            expect(getFilteredRows(plans, { nom: 'Phase' })).toEqual([
                plaineSud,
            ])
        })

        it('ignores the spaces around the query', () => {
            expect(getFilteredRows(plans, { nom: '  Bel-Orme  ' })).toEqual([
                belOrme,
            ])
        })

        it('returns nothing when no name matches', () => {
            expect(getFilteredRows(plans, { nom: 'Bioraffinerie' })).toEqual([])
        })

        it('keeps the rows in the order they were given', () => {
            // '1' is in the first and the last name, not in the middle one, so
            // a result that came back reordered would show up here.
            expect(getFilteredRows(plans, { nom: '1' })).toEqual([
                valFleuri,
                plaineSud,
            ])
        })
    })

    describe('on statuts', () => {
        it('keeps the rows carrying the selected statut', () => {
            expect(getFilteredRows(plans, { statuts: ['abandonné'] })).toEqual([
                belOrme,
            ])
        })

        it('keeps the rows carrying any of several statuts, in order', () => {
            expect(
                getFilteredRows(plans, { statuts: ['abandonné', 'projet'] })
            ).toEqual([valFleuri, belOrme, plaineSud])
        })

        it('returns nothing when no row carries the selected statut', () => {
            expect(getFilteredRows(plans, { statuts: ['obsolète'] })).toEqual(
                []
            )
        })
    })

    describe('on appelsAProjet', () => {
        it('keeps the rows attached to the selected call', () => {
            expect(
                getFilteredRows(plans, {
                    appelsAProjet: ['GRANULÉS NA (2023)'],
                })
            ).toEqual([belOrme])
        })

        it('keeps the rows attached to any of several calls, in order', () => {
            expect(
                getFilteredRows(plans, {
                    appelsAProjet: ['GRANULÉS NA (2023)', 'CHALEUR+ (2024)'],
                })
            ).toEqual([valFleuri, belOrme])
        })

        it('selects the rows attached to no call at all', () => {
            expect(getFilteredRows(plans, { appelsAProjet: [''] })).toEqual([
                plaineSud,
            ])
        })
    })

    describe('on lieux', () => {
        it('keeps the rows situated in the selected commune', () => {
            expect(getFilteredRows(plans, { lieux: ['Guéret (23)'] })).toEqual([
                belOrme,
            ])
        })

        it('keeps the rows of several communes, in order', () => {
            expect(
                getFilteredRows(plans, {
                    lieux: ['Poitiers (86)', 'Guéret (23)'],
                })
            ).toEqual([valFleuri, belOrme, plaineSud])
        })

        it('returns nothing when no row is situated there', () => {
            expect(getFilteredRows(plans, { lieux: ['Lacq (64)'] })).toEqual([])
        })
    })

    describe('with nothing to filter on', () => {
        it('returns every row when no criterion is given', () => {
            expect(getFilteredRows(plans)).toEqual(plans)
        })

        it('returns every row when the search is cleared', () => {
            expect(getFilteredRows(plans, { nom: '' })).toEqual(plans)
        })

        it('returns every row when no statut is selected', () => {
            expect(getFilteredRows(plans, { statuts: [] })).toEqual(plans)
        })

        it('returns every row once every criterion is cleared', () => {
            // What the reset button leaves behind.
            expect(
                getFilteredRows(plans, {
                    nom: '',
                    statuts: [],
                    lieux: [],
                    appelsAProjet: [],
                })
            ).toEqual(plans)
        })
    })

    describe('with several criteria', () => {
        it('keeps only the rows matching all of them', () => {
            // 'i' is in all three names; the statut is what narrows it down.
            expect(
                getFilteredRows(plans, { nom: 'i', statuts: ['projet'] })
            ).toEqual([valFleuri, plaineSud])
        })

        it('returns nothing when no row matches both', () => {
            expect(
                getFilteredRows(plans, {
                    nom: 'Bel-Orme',
                    statuts: ['projet'],
                })
            ).toEqual([])
        })
    })

    it('hands back the very rows it was given', () => {
        expect(getFilteredRows(plans, { nom: 'rcu' })[0]).toBe(valFleuri)
    })

    it('leaves the rows it was given untouched', () => {
        const rows = [valFleuri, belOrme, plaineSud]

        getFilteredRows(rows, { nom: 'rcu', statuts: ['projet'] })

        expect(rows).toEqual([valFleuri, belOrme, plaineSud])
    })

    describe('with null formula columns', () => {
        const nullish = planWith({
            id: 4,
            id_pa: 4,
            Nom: null,
            Appel_a_projet: null,
            Departement_de_situation: null,
        })
        const withNull: readonly Plan_d_approvisionnement[] = [
            valFleuri,
            nullish,
        ]

        it('does not throw and skips a null name on a nom search', () => {
            expect(getFilteredRows(withNull, { nom: 'rcu' })).toEqual([
                valFleuri,
            ])
        })

        it('treats a null appel à projet as « no call »', () => {
            expect(getFilteredRows(withNull, { appelsAProjet: [''] })).toEqual([
                nullish,
            ])
        })
    })
})

describe('getResultCountLabel', () => {
    it('counts several rows in the plural', () => {
        expect(getResultCountLabel(12)).toBe('12 résultats')
    })

    it('counts a single row in the singular', () => {
        expect(getResultCountLabel(1)).toBe('1 résultat')
    })

    it('counts no row at all in the singular, as French does', () => {
        expect(getResultCountLabel(0)).toBe('0 résultat')
    })
})

describe('isLaureat', () => {
    it('reads « oui » as won', () => {
        expect(isLaureat('oui')).toBe(true)
    })

    it('ignores the case and the spaces around the answer', () => {
        expect(isLaureat('  Oui ')).toBe(true)
    })

    it('reads « non » as not won', () => {
        expect(isLaureat('non')).toBe(false)
    })

    it('reads an unanswered cell as not won', () => {
        expect(isLaureat('')).toBe(false)
    })

    it('reads a wording it does not know as not won', () => {
        expect(isLaureat('en cours')).toBe(false)
    })
})

describe('getDemandesSubventionByPlanId', () => {
    // A demande de subvention is what ties an instruction to a plan: the
    // instruction names the demande, the demande names the plan.
    const demandes = [
        { id: 10, Plan_d_approvisionnement: 1 },
        { id: 20, Plan_d_approvisionnement: 2 },
    ]

    const crbs = [
        { id: 5, Nom: 'CRB Nouvelle-Aquitaine' },
        { id: 6, Nom: 'CRB Occitanie' },
    ]

    function instructionWith(
        instruction: Partial<InstructionCrbAccueil> = {}
    ): InstructionCrbAccueil {
        return {
            id: 100,
            subvention: 10,
            crb: 5,
            Phase_de_l_instruction: 'Avis CRB en attente',
            Date_saisine_CRB: null,
            Date_avis_CRB: null,
            Date_avis_Prefet: null,
            ...instruction,
        }
    }

    it('gives a plan one entry per demande de subvention', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            [
                { id: 10, Plan_d_approvisionnement: 1 },
                { id: 11, Plan_d_approvisionnement: 1 },
            ],
            [],
            crbs
        )

        expect(demandesByPlanId.get(1)).toEqual([
            { id: 10, fils: [] },
            { id: 11, fils: [] },
        ])
    })

    it('returns no fils when no instruction crb was provided', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [],
            crbs
        )

        expect(demandesByPlanId.get(1)).toEqual([{ id: 10, fils: [] }])
    })

    it('gives a demande one fil per instruction filed against it', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [
                instructionWith({ id: 100 }),
                instructionWith({ id: 101 }),
                instructionWith({ id: 102, subvention: 20 }),
            ],
            crbs
        )

        expect(demandesByPlanId.get(1)?.[0].fils.map((fil) => fil.id)).toEqual([
            100, 101,
        ])
        expect(demandesByPlanId.get(2)?.[0].fils.map((fil) => fil.id)).toEqual([
            102,
        ])
    })

    it('carries the phase, the CRB and the dates of an instruction', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [
                instructionWith({
                    crb: 6,
                    Phase_de_l_instruction: 'Instruction terminée',
                    Date_saisine_CRB: 1710201600,
                    Date_avis_CRB: 1716854400,
                    Date_avis_Prefet: 1718323200,
                }),
            ],
            crbs
        )

        expect(demandesByPlanId.get(1)?.[0].fils[0]).toEqual({
            id: 100,
            crb: 'CRB Occitanie',
            phase: 'Instruction terminée',
            dateSaisineCrb: 1710201600,
            dateAvisCrb: 1716854400,
            dateAvisPrefet: 1718323200,
        })
    })

    it('leaves the CRB unnamed when the instruction names none', () => {
        // An unset Ref comes back from Grist as 0 or false, never as a rowId.
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [instructionWith({ crb: 0 }), instructionWith({ crb: 99 })],
            crbs
        )

        expect(demandesByPlanId.get(1)?.[0].fils.map((fil) => fil.crb)).toEqual(
            ['', '']
        )
    })

    it('leaves the phase empty when the document could not compute it', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [instructionWith({ Phase_de_l_instruction: null })],
            crbs
        )

        expect(demandesByPlanId.get(1)?.[0].fils[0].phase).toBe('')
    })

    it('reads a date the document left unset as « not yet »', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [instructionWith({ Date_saisine_CRB: false })],
            crbs
        )

        expect(demandesByPlanId.get(1)?.[0].fils[0].dateSaisineCrb).toBeNull()
    })

    it('drops an instruction attached to no demande at all', () => {
        const demandesByPlanId = getDemandesSubventionByPlanId(
            demandes,
            [
                instructionWith({ subvention: 0 }),
                instructionWith({ subvention: 99 }),
            ],
            crbs
        )

        expect(demandesByPlanId.get(1)?.[0].fils).toEqual([])
    })

    it('ignores a demande attached to no plan', () => {
        expect(
            getDemandesSubventionByPlanId(
                [{ id: 30, Plan_d_approvisionnement: 0 }],
                [instructionWith({ subvention: 30 })],
                crbs
            )
        ).toEqual(new Map())
    })

    it('leaves out a plan with no demande at all', () => {
        expect(getDemandesSubventionByPlanId([], [], crbs)).toEqual(new Map())
    })
})

describe('getPhasesInstruction', () => {
    function fil(phase: string) {
        return {
            id: 1,
            crb: '',
            phase,
            dateSaisineCrb: null,
            dateAvisCrb: null,
            dateAvisPrefet: null,
        }
    }

    it('gathers the phases of every fil of every demande, in order', () => {
        expect(
            getPhasesInstruction([
                { id: 10, fils: [fil('Avis CRB rendu')] },
                {
                    id: 11,
                    fils: [
                        fil('Avis préfet en attente'),
                        fil('Avis CRB rendu'),
                    ],
                },
            ])
        ).toEqual([
            'Avis CRB rendu',
            'Avis préfet en attente',
            'Avis CRB rendu',
        ])
    })

    it('leaves out a fil whose phase is empty', () => {
        expect(
            getPhasesInstruction([
                { id: 10, fils: [fil(''), fil('Avis CRB rendu')] },
            ])
        ).toEqual(['Avis CRB rendu'])
    })

    it('returns nothing for a plan with no demande', () => {
        expect(getPhasesInstruction([])).toEqual([])
    })
})

describe('getDerniereEtapeFaite', () => {
    const SAISINE = 1710201600
    const AVIS_CRB = 1716854400
    const AVIS_PREFET = 1718323200

    it('points at the last step carrying a date', () => {
        expect(getDerniereEtapeFaite([SAISINE, AVIS_CRB, null, null])).toBe(1)
    })

    it('counts an undated step as done when a later one has happened', () => {
        // What the document looks like when the préfet has ruled but nobody
        // recorded the day the CRB did: the avis CRB happened all the same.
        expect(getDerniereEtapeFaite([SAISINE, null, AVIS_PREFET, null])).toBe(
            2
        )
    })

    it('counts every step done once the last one has happened', () => {
        expect(getDerniereEtapeFaite([null, null, null, AVIS_PREFET])).toBe(3)
    })

    it('points before the first step when nothing has happened', () => {
        expect(getDerniereEtapeFaite([null, null, null, null])).toBe(-1)
    })

    it('points before the first step when there is no step at all', () => {
        expect(getDerniereEtapeFaite([])).toBe(-1)
    })
})

describe('formatDate', () => {
    it('writes a Grist date the way a French form does', () => {
        // 12 March 2024, as Grist stores it: seconds since the epoch, at UTC
        // midnight.
        expect(formatDate(1710201600)).toBe('12/03/2024')
    })

    it('reads the date back in UTC, not in the browser’s timezone', () => {
        // Midnight UTC is still the day before in New York, so the same date
        // formatted in the local timezone would come out as 11/03. Restored in
        // a `finally`, or a failure here would leave every later test running
        // in New York.
        const timezone = process.env.TZ
        process.env.TZ = 'America/New_York'

        try {
            expect(formatDate(1710201600)).toBe('12/03/2024')
        } finally {
            // Assigning `undefined` would set it to the string 'undefined', so
            // an unset timezone has to be deleted rather than written back.
            if (timezone === undefined) delete process.env.TZ
            else process.env.TZ = timezone
        }
    })
})
