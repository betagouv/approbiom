import { describe, expect, it } from 'vitest'
import {
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

// A Tuesday: the week under way is the one of Monday 19 October.
const MAINTENANT = new Date('2026-10-20T10:00:00Z')

const COMPTES: Compte[] = [
    utilisateur(CAMILLE),
    utilisateur(ALEX),
    utilisateur('sam.petit@example.fr'),
    utilisateur('jean.dupont@example.fr'),
    { email: ADMIN, utilisateurApprobiom: false },
]

const suivre = (plans: readonly Creation[], comptes = COMPTES) =>
    suivreCreations(plans, comptes, MAINTENANT)

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

describe('suivreCreations, line by line', () => {
    // Every plan created before the tracking began has neither a creator nor
    // a date.
    it('leaves untracked plans out of every count', () => {
        const suivi = suivre([
            creation(null, null),
            creation(null, null),
            creation(CAMILLE, '2026-10-16T13:39:26Z'),
        ])

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 1 },
        ])
    })

    it('counts the plans of each user in each week, the latest week first', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-10-16T13:39:26Z'),
            creation(CAMILLE, '2026-10-16T13:53:58Z'),
            creation(CAMILLE, '2026-10-19T08:00:00Z'),
            creation(ALEX, '2026-10-19T08:58:19Z'),
        ])

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-19', utilisateur: ALEX, plans: 1 },
            { semaine: '2026-10-19', utilisateur: CAMILLE, plans: 1 },
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 2 },
        ])
    })

    it('puts the most active users of a week first, then sorts by email', () => {
        const suivi = suivre(
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
})

describe('suivreCreations, week by week', () => {
    it('counts each user once in a week, however many plans they created', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-10-12T10:00:00Z'),
            creation(CAMILLE, '2026-10-13T10:00:00Z'),
            creation(CAMILLE, '2026-10-16T10:00:00Z'),
            creation(ALEX, '2026-10-16T11:00:00Z'),
            creation(CAMILLE, '2026-10-19T10:00:00Z'),
        ])

        expect(suivi.semaines).toEqual([
            { semaine: '2026-10-12', utilisateurs: 2 },
            { semaine: '2026-10-19', utilisateurs: 1 },
        ])
    })

    // A chart over time leaves a gap where nothing happened, rather than
    // jumping from one active week to the next.
    it('keeps the weeks without a creation, at 0', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-10-06T10:00:00Z'),
            creation(ALEX, '2026-10-19T10:00:00Z'),
        ])

        expect(suivi.semaines).toEqual([
            { semaine: '2026-10-05', utilisateurs: 1 },
            { semaine: '2026-10-12', utilisateurs: 0 },
            { semaine: '2026-10-19', utilisateurs: 1 },
        ])
    })

    // The chart starts in October 2026, with the tracking: a plan dated
    // before was dated by hand, and counts nowhere.
    it('leaves out a plan dated before the tracking began', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-06-01T10:00:00Z'),
            creation(ALEX, '2026-10-14T10:00:00Z'),
        ])

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: ALEX, plans: 1 },
        ])
        expect(suivi.semaines[0]).toEqual({
            semaine: '2026-10-12',
            utilisateurs: 1,
        })
    })

    // 22:30 in Paris on Sunday 4 October is still the week of 28 September;
    // at 00:30 on Monday 5, two hours later, the tracking is open.
    it('begins the tracking on Monday 5 October 2026, in Paris time', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-10-04T20:30:00Z'),
            creation(ALEX, '2026-10-04T22:30:00Z'),
        ])

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-05', utilisateur: ALEX, plans: 1 },
        ])
        expect(suivi.semaines[0]?.semaine).toBe('2026-10-05')
    })

    it('runs up to the week under way, even when no one created a plan in it', () => {
        const suivi = suivre([creation(CAMILLE, '2026-10-16T10:00:00Z')])

        expect(suivi.semaines.at(-1)).toEqual({
            semaine: '2026-10-19',
            utilisateurs: 0,
        })
        expect(suivi.cetteSemaine).toEqual({
            semaine: '2026-10-19',
            utilisateurs: 0,
        })
    })

    it('counts the users who created a plan in the week under way', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-10-19T08:00:00Z'),
            creation(CAMILLE, '2026-10-20T08:00:00Z'),
            creation(ALEX, '2026-10-20T09:00:00Z'),
            creation(ADMIN, '2026-10-20T09:30:00Z'),
        ])

        expect(suivi.cetteSemaine).toEqual({
            semaine: '2026-10-19',
            utilisateurs: 2,
        })
    })

    // Monday 26 October, 00:30 in Paris, is still Sunday 25 in UTC.
    it('takes the week under way in Paris time', () => {
        const suivi = suivreCreations(
            [],
            COMPTES,
            new Date('2026-10-25T23:30:00Z')
        )

        expect(suivi.cetteSemaine.semaine).toBe('2026-10-26')
    })

    // Paris leaves summer time on 25 October: a 25-hour day must not knock a
    // week off its Monday.
    it('steps from one Monday to the next across the change of time', () => {
        const suivi = suivreCreations(
            [creation(CAMILLE, '2026-10-21T10:00:00Z')],
            COMPTES,
            new Date('2026-11-03T10:00:00Z')
        )

        expect(suivi.semaines.map(({ semaine }) => semaine)).toEqual([
            '2026-10-19',
            '2026-10-26',
            '2026-11-02',
        ])
    })

    // A plan dated past today, by a clock ahead of the widget's, still shows.
    it('runs on to a creation dated after the week under way', () => {
        const suivi = suivre([creation(CAMILLE, '2026-10-27T10:00:00Z')])

        expect(suivi.semaines).toEqual([
            { semaine: '2026-10-26', utilisateurs: 1 },
        ])
    })

    it('has no week to show before a user creates a plan', () => {
        expect(suivre([creation(null, null)])).toStrictEqual({
            lignes: [],
            semaines: [],
            cetteSemaine: { semaine: '2026-10-19', utilisateurs: 0 },
            nombreUtilisateurs: 4,
        })
    })
})

describe('suivreCreations, by the accounts of the Utilisateur table', () => {
    // The administrators' plans are tests and support, not the use tracked.
    it('counts the plans of the accounts ticked « Utilisateur Approbiom » only', () => {
        const suivi = suivre([
            creation(CAMILLE, '2026-10-16T10:00:00Z'),
            creation(ADMIN, '2026-10-16T11:00:00Z'),
            creation(ADMIN, '2026-10-19T11:00:00Z'),
        ])

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 1 },
        ])
        expect(suivi.semaines).toEqual([
            { semaine: '2026-10-12', utilisateurs: 1 },
            { semaine: '2026-10-19', utilisateurs: 0 },
        ])
    })

    // Not every creator has a row in the table: a plan made from an account
    // nobody listed is no user's either.
    it('leaves out the plans of an account missing from the table', () => {
        const suivi = suivre([
            creation('inconnu@example.fr', '2026-10-16T10:00:00Z'),
        ])

        expect(suivi.lignes).toEqual([])
    })

    // Nothing says whose they are, so nothing says they are a user's.
    it('leaves out the plans of an unknown creator', () => {
        const suivi = suivre([creation(null, '2026-10-16T10:00:00Z')])

        expect(suivi.lignes).toEqual([])
    })

    it('matches an email whatever its case and the spaces around it', () => {
        const suivi = suivre(
            [
                creation('Camille.Martin@example.fr', '2026-10-16T10:00:00Z'),
                creation(CAMILLE, '2026-10-16T11:00:00Z'),
            ],
            [utilisateur(' CAMILLE.MARTIN@EXAMPLE.FR ')]
        )

        // One address: one user, on one line, active once that week.
        expect(suivi.nombreUtilisateurs).toBe(1)
        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: CAMILLE, plans: 2 },
        ])
        expect(suivi.semaines[0]).toEqual({
            semaine: '2026-10-12',
            utilisateurs: 1,
        })
    })

    it('counts the users ticked « Utilisateur Approbiom », each once', () => {
        const suivi = suivre(
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
    // to.
    it('leaves out a ticked account without an email', () => {
        const suivi = suivre(
            [],
            [utilisateur(CAMILLE), utilisateur(''), utilisateur('  ')]
        )

        expect(suivi.nombreUtilisateurs).toBe(1)
    })
})
