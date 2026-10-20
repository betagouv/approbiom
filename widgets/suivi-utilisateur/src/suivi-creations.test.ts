import { describe, expect, it } from 'vitest'
import {
    partDesCreateurs,
    semaineDe,
    suivreCreations,
    type Compte,
    type Creation,
} from './suivi-creations'

const creation = (
    createdBy: string | null,
    createdAt: string | null
): Creation => ({
    createdBy,
    createdAt: createdAt === null ? null : new Date(createdAt),
})

const utilisateur = (email: string): Compte => ({
    email,
    utilisateurApprobiom: true,
})

const CAMILLE = 'camille.martin@example.fr'
const ALEX = 'alex.durand@example.fr'
const ADMIN = 'admin@example.fr'

const COMPTES: Compte[] = [
    utilisateur(CAMILLE),
    utilisateur(ALEX),
    utilisateur('sam.petit@example.fr'),
    utilisateur('jean.dupont@example.fr'),
    { email: ADMIN, utilisateurApprobiom: false },
]

describe('semaineDe', () => {
    it('names a week by its Monday', () => {
        expect(semaineDe(new Date('2026-10-16T13:39:26Z'))).toBe('2026-10-12')
    })

    // 23:30 UTC on Sunday is already 01:30 on Monday in Paris: the week is
    // the one Grist's own `Cree_la_semaine` column gives it.
    it('takes the day in Paris, not in UTC', () => {
        expect(semaineDe(new Date('2026-10-18T23:30:00Z'))).toBe('2026-10-19')
    })

    // Paris leaves summer time on Sunday 25 October 2026, a 25-hour day.
    it('is not thrown by the change to winter time', () => {
        expect(semaineDe(new Date('2026-10-26T00:30:00+01:00'))).toBe(
            '2026-10-26'
        )
        expect(semaineDe(new Date('2026-10-25T23:30:00+01:00'))).toBe(
            '2026-10-19'
        )
    })
})

describe('suivreCreations', () => {
    // Every plan created before the tracking began has neither a creator nor
    // a date.
    it('leaves untracked plans out of every count', () => {
        const suivi = suivreCreations(
            [
                creation(null, null),
                creation(null, null),
                creation(CAMILLE, '2026-10-16T13:39:26Z'),
            ],
            COMPTES
        )

        expect(suivi.totalPlans).toBe(1)
        expect(suivi.nombreCreateurs).toBe(1)
        expect(suivi.lignes).toHaveLength(1)
    })

    it('reads as no creation at all when no plan is tracked yet', () => {
        expect(suivreCreations([creation(null, null)], COMPTES)).toStrictEqual({
            lignes: [],
            totalPlans: 0,
            premiereCreation: null,
            nombreCreateurs: 0,
            nombreUtilisateurs: 4,
        })
    })

    it('counts the plans of each user in each week, the latest week first', () => {
        const suivi = suivreCreations(
            [
                creation(CAMILLE, '2026-10-16T13:39:26Z'),
                creation(CAMILLE, '2026-10-16T13:53:58Z'),
                creation(CAMILLE, '2026-10-19T08:00:00Z'),
                creation(ALEX, '2026-10-19T08:58:19Z'),
            ],
            COMPTES
        )

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-19', utilisateur: ALEX, plans: 1 },
            { semaine: '2026-10-19', utilisateur: CAMILLE, plans: 1 },
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 2 },
        ])
    })

    // A week where no one created a plan has nothing to count: no line.
    it('leaves out the weeks without a creation', () => {
        const suivi = suivreCreations(
            [
                creation(CAMILLE, '2026-09-30T10:00:00Z'),
                creation(CAMILLE, '2026-10-19T10:00:00Z'),
            ],
            COMPTES
        )

        expect(suivi.lignes.map(({ semaine }) => semaine)).toEqual([
            '2026-10-19',
            '2026-09-28',
        ])
    })

    it('puts the most active users of a week first, then sorts by email', () => {
        const suivi = suivreCreations(
            [
                creation('zoe@example.fr', '2026-10-16T10:00:00Z'),
                creation('émile@example.fr', '2026-10-16T10:00:00Z'),
                creation('arthur@example.fr', '2026-10-16T10:00:00Z'),
                creation('zoe@example.fr', '2026-10-16T11:00:00Z'),
            ],
            [
                utilisateur('zoe@example.fr'),
                utilisateur('émile@example.fr'),
                utilisateur('arthur@example.fr'),
            ]
        )

        expect(suivi.lignes.map(({ utilisateur }) => utilisateur)).toEqual([
            'zoe@example.fr',
            'arthur@example.fr',
            'émile@example.fr',
        ])
    })

    // Someone active over several weeks is still one user who created plans.
    it('counts a user once, however many weeks they created plans in', () => {
        const suivi = suivreCreations(
            [
                creation(CAMILLE, '2026-10-05T10:00:00Z'),
                creation(CAMILLE, '2026-10-16T10:00:00Z'),
                creation(ALEX, '2026-10-19T10:00:00Z'),
            ],
            COMPTES
        )

        expect(suivi.nombreCreateurs).toBe(2)
    })

    it('dates the tracking from the first creation of a user', () => {
        const suivi = suivreCreations(
            [
                creation(ADMIN, '2026-10-14T10:00:00Z'),
                creation(ALEX, '2026-10-19T08:58:19Z'),
                creation(CAMILLE, '2026-10-16T13:39:26Z'),
            ],
            COMPTES
        )

        expect(suivi.premiereCreation).toEqual(new Date('2026-10-16T13:39:26Z'))
    })
})

describe('suivreCreations, by the accounts of the Utilisateur table', () => {
    // The administrators' plans are tests and support, not the use tracked.
    it('counts the plans of the accounts ticked « Utilisateur Approbiom » only', () => {
        const suivi = suivreCreations(
            [
                creation(CAMILLE, '2026-10-16T10:00:00Z'),
                creation(ADMIN, '2026-10-16T11:00:00Z'),
                creation(ADMIN, '2026-10-19T11:00:00Z'),
            ],
            COMPTES
        )

        expect(suivi.totalPlans).toBe(1)
        expect(suivi.nombreCreateurs).toBe(1)
        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 1 },
        ])
    })

    // Not every creator has a row in the table: a plan made from an account
    // nobody listed is no user's either.
    it('leaves out the plans of an account missing from the table', () => {
        const suivi = suivreCreations(
            [creation('inconnu@example.fr', '2026-10-16T10:00:00Z')],
            COMPTES
        )

        expect(suivi.totalPlans).toBe(0)
    })

    // Nothing says whose they are, so nothing says they are a user's.
    it('leaves out the plans of an unknown creator', () => {
        const suivi = suivreCreations(
            [creation(null, '2026-10-16T10:00:00Z')],
            COMPTES
        )

        expect(suivi.totalPlans).toBe(0)
    })

    it('matches an email whatever its case and the spaces around it', () => {
        const suivi = suivreCreations(
            [
                creation('Camille.Martin@example.fr', '2026-10-16T10:00:00Z'),
                creation(CAMILLE, '2026-10-16T11:00:00Z'),
            ],
            [utilisateur(' CAMILLE.MARTIN@EXAMPLE.FR ')]
        )

        expect(suivi.totalPlans).toBe(2)
        // One address: one creator, out of one user, on one line.
        expect(suivi.nombreCreateurs).toBe(1)
        expect(suivi.nombreUtilisateurs).toBe(1)
        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 2 },
        ])
    })

    it('counts the users ticked « Utilisateur Approbiom », each once', () => {
        const suivi = suivreCreations(
            [],
            [
                utilisateur(CAMILLE),
                utilisateur('Camille.Martin@example.fr'),
                utilisateur(ALEX),
                { email: ADMIN, utilisateurApprobiom: false },
            ]
        )

        expect(suivi.nombreUtilisateurs).toBe(2)
    })

    // A ticked row without an email names no one a plan could be traced back
    // to: counting it would keep the share from ever reaching 100 %.
    it('leaves out a ticked account without an email', () => {
        const suivi = suivreCreations(
            [],
            [utilisateur(CAMILLE), utilisateur(''), utilisateur('  ')]
        )

        expect(suivi.nombreUtilisateurs).toBe(1)
    })
})

describe('partDesCreateurs', () => {
    it('divides the creators by the users', () => {
        expect(
            partDesCreateurs({ nombreCreateurs: 1, nombreUtilisateurs: 4 })
        ).toBe(0.25)
    })

    it('is unknown while no account is ticked « Utilisateur Approbiom »', () => {
        expect(
            partDesCreateurs({ nombreCreateurs: 0, nombreUtilisateurs: 0 })
        ).toBeNull()
    })
})
