import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'

/**
 * A week, Monday to Sunday in Paris time, named by its Monday as
 * `YYYY-MM-DD`. The same weeks as the document's own `Cree_la_semaine`
 * column, so the widget and Grist count alike.
 */
export type Semaine = string

/** The plans one user created in one week. */
export type CreationsDeLaSemaine = {
    semaine: Semaine
    /** null: Grist recorded when the plan was created, but not by whom. */
    utilisateur: string | null
    plans: number
}

/** What the tracking reads of a plan: who created it, and when. */
export type Creation = Pick<Plan, 'createdBy' | 'createdAt'>

export type SuiviCreations = {
    /**
     * One line per user and per week they created a plan in: the most recent
     * week first, then the most plans, the unknown creator last.
     */
    lignes: readonly CreationsDeLaSemaine[]
    totalPlans: number
    premiereCreation: Date | null
    /** Users known by name who created at least one plan. */
    nombreCreateurs: number
}

const PARIS = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
})

/**
 * The day `date` falls on in Paris, as midnight UTC: once off the clock, a day
 * is always 24 hours, whatever daylight saving does.
 */
function jourAParis(date: Date): Date {
    const parts = Object.fromEntries(
        PARIS.formatToParts(date).map(({ type, value }) => [type, value])
    )

    return new Date(
        Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
    )
}

const ajouterJours = (jour: Date, jours: number): Date =>
    new Date(jour.getTime() + jours * 24 * 60 * 60 * 1000)

export function semaineDe(date: Date): Semaine {
    const jour = jourAParis(date)
    // `getUTCDay` starts the week on Sunday; ISO weeks start on Monday.
    const joursDepuisLundi = (jour.getUTCDay() + 6) % 7

    return ajouterJours(jour, -joursDepuisLundi).toISOString().slice(0, 10)
}

const AUCUNE_CREATION: SuiviCreations = {
    lignes: [],
    totalPlans: 0,
    premiereCreation: null,
    nombreCreateurs: 0,
}

/**
 * Counts the plans created per user and per week. Plans created before the
 * tracking began carry no date, and are left out of every count.
 */
export function suivreCreations(plans: readonly Creation[]): SuiviCreations {
    const suivies = plans.filter(
        (plan): plan is Creation & { createdAt: Date } =>
            plan.createdAt !== null
    )
    if (suivies.length === 0) return AUCUNE_CREATION

    // Keyed by week, then by user: a `Map` keeps `null` apart from any name.
    const parSemaine = new Map<Semaine, Map<string | null, number>>()
    for (const { createdBy, createdAt } of suivies) {
        const semaine = semaineDe(createdAt)
        const parUtilisateur =
            parSemaine.get(semaine) ?? new Map<string | null, number>()
        parUtilisateur.set(createdBy, (parUtilisateur.get(createdBy) ?? 0) + 1)
        parSemaine.set(semaine, parUtilisateur)
    }

    const lignes = [...parSemaine]
        .flatMap(([semaine, parUtilisateur]) =>
            [...parUtilisateur].map(([utilisateur, plans]) => ({
                semaine,
                utilisateur,
                plans,
            }))
        )
        .sort(
            (a, b) =>
                // ISO dates sort as text, so this is a chronological order.
                b.semaine.localeCompare(a.semaine) ||
                Number(a.utilisateur === null) -
                    Number(b.utilisateur === null) ||
                b.plans - a.plans ||
                (a.utilisateur ?? '').localeCompare(b.utilisateur ?? '', 'fr')
        )

    const createurs = new Set(
        suivies.flatMap(({ createdBy }) =>
            createdBy === null ? [] : [createdBy]
        )
    )

    return {
        lignes,
        totalPlans: suivies.length,
        premiereCreation: new Date(
            Math.min(...suivies.map(({ createdAt }) => createdAt.getTime()))
        ),
        nombreCreateurs: createurs.size,
    }
}

/**
 * Share of all users who created at least one plan, from 0 to 1. Unknown until
 * the widget is told how many users there are.
 */
export const partDesCreateurs = (
    { nombreCreateurs }: Pick<SuiviCreations, 'nombreCreateurs'>,
    nombreUtilisateurs: number | null
): number | null =>
    nombreUtilisateurs === null ? null : nombreCreateurs / nombreUtilisateurs
