import { describe, expect, it } from 'vitest'
import {
    partDesCreateurs,
    semaineDe,
    suivreCreations,
    type Creation,
} from './suivi-creations'

const creation = (
    createdBy: string | null,
    createdAt: string | null
): Creation => ({
    createdBy,
    createdAt: createdAt === null ? null : new Date(createdAt),
})

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
        const suivi = suivreCreations([
            creation(null, null),
            creation(null, null),
            creation('claire.godel', '2026-10-16T13:39:26Z'),
        ])

        expect(suivi.totalPlans).toBe(1)
        expect(suivi.nombreCreateurs).toBe(1)
        expect(suivi.lignes).toHaveLength(1)
    })

    it('reads as no creation at all when no plan is tracked yet', () => {
        expect(suivreCreations([creation(null, null)])).toStrictEqual({
            lignes: [],
            totalPlans: 0,
            premiereCreation: null,
            nombreCreateurs: 0,
        })
    })

    it('counts the plans of each user in each week, the latest week first', () => {
        const suivi = suivreCreations([
            creation('claire.godel', '2026-10-16T13:39:26Z'),
            creation('claire.godel', '2026-10-16T13:53:58Z'),
            creation('claire.godel', '2026-10-19T08:00:00Z'),
            creation('valentine.langer.ext', '2026-10-19T08:58:19Z'),
        ])

        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-19', utilisateur: 'claire.godel', plans: 1 },
            {
                semaine: '2026-10-19',
                utilisateur: 'valentine.langer.ext',
                plans: 1,
            },
            { semaine: '2026-10-12', utilisateur: 'claire.godel', plans: 2 },
        ])
    })

    // A week where no one created a plan has nothing to count: no line.
    it('leaves out the weeks without a creation', () => {
        const suivi = suivreCreations([
            creation('claire.godel', '2026-09-30T10:00:00Z'),
            creation('claire.godel', '2026-10-19T10:00:00Z'),
        ])

        expect(suivi.lignes.map(({ semaine }) => semaine)).toEqual([
            '2026-10-19',
            '2026-09-28',
        ])
    })

    it('puts the most active users of a week first, then sorts by name', () => {
        const suivi = suivreCreations([
            creation('zoé', '2026-10-16T10:00:00Z'),
            creation('Émile', '2026-10-16T10:00:00Z'),
            creation('arthur', '2026-10-16T10:00:00Z'),
            creation('zoé', '2026-10-16T11:00:00Z'),
        ])

        expect(suivi.lignes.map(({ utilisateur }) => utilisateur)).toEqual([
            'zoé',
            'arthur',
            'Émile',
        ])
    })

    // Someone active over several weeks is still one user who created plans.
    it('counts a user once, however many weeks they created plans in', () => {
        const suivi = suivreCreations([
            creation('claire.godel', '2026-10-05T10:00:00Z'),
            creation('claire.godel', '2026-10-16T10:00:00Z'),
            creation('valentine.langer.ext', '2026-10-19T10:00:00Z'),
        ])

        expect(suivi.nombreCreateurs).toBe(2)
    })

    it('dates the tracking from its first creation', () => {
        const suivi = suivreCreations([
            creation('valentine.langer.ext', '2026-10-19T08:58:19Z'),
            creation('claire.godel', '2026-10-16T13:39:26Z'),
        ])

        expect(suivi.premiereCreation).toEqual(new Date('2026-10-16T13:39:26Z'))
    })

    // A plan whose date was recorded without its creator still counts as a
    // plan created, but names no one who created it.
    it('counts the plans of an unknown creator, but not the creator', () => {
        const suivi = suivreCreations([
            creation(null, '2026-10-16T10:00:00Z'),
            creation(null, '2026-10-16T11:00:00Z'),
            creation('claire.godel', '2026-10-16T12:00:00Z'),
        ])

        expect(suivi.totalPlans).toBe(3)
        expect(suivi.nombreCreateurs).toBe(1)
        expect(suivi.lignes).toEqual([
            { semaine: '2026-10-12', utilisateur: 'claire.godel', plans: 1 },
            { semaine: '2026-10-12', utilisateur: null, plans: 2 },
        ])
    })
})

describe('partDesCreateurs', () => {
    it('divides the creators by all users', () => {
        expect(partDesCreateurs({ nombreCreateurs: 3 }, 12)).toBe(0.25)
    })

    it('is unknown until the number of users is configured', () => {
        expect(partDesCreateurs({ nombreCreateurs: 3 }, null)).toBeNull()
    })
})
