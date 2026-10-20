import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Utilisateur } from '@shared/core/domain/entities/utilisateur'

/**
 * A week, Monday to Sunday in Paris time, named by its Monday as
 * `YYYY-MM-DD`. The same weeks as the document's own `Cree_la_semaine`
 * column, so the widget and Grist count alike.
 */
export type Semaine = string

/** The plans one user created in one week. */
export type CreationsDeLaSemaine = {
    semaine: Semaine
    /** The user's email, in lower case. */
    utilisateur: string
    plans: number
}

/** What the tracking reads of a plan: who created it, and when. */
export type Creation = Pick<Plan, 'createdBy' | 'createdAt'>

/** What it reads of an account: its email, and whether its use is tracked. */
export type Compte = Pick<Utilisateur, 'email' | 'utilisateurApprobiom'>

export type SuiviCreations = {
    /**
     * One line per user and per week they created a plan in: the most recent
     * week first, then the most plans.
     */
    lignes: readonly CreationsDeLaSemaine[]
    totalPlans: number
    premiereCreation: Date | null
    /** Users who created at least one plan. */
    nombreCreateurs: number
    /** Accounts ticked « Utilisateur Approbiom », each counted once. */
    nombreUtilisateurs: number
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

/** « Camille.Martin@… » and « camille.martin@… » are the same address. */
const normaliserEmail = (email: string): string => email.trim().toLowerCase()

/**
 * The emails of the accounts ticked « Utilisateur Approbiom », each once, in
 * lower case. A row without an email names no one a plan could be traced back
 * to, and is left out.
 */
function emailsDesUtilisateurs(comptes: readonly Compte[]): Set<string> {
    return new Set(
        comptes.flatMap(({ email, utilisateurApprobiom }) => {
            const adresse = normaliserEmail(email)
            return utilisateurApprobiom && adresse !== '' ? [adresse] : []
        })
    )
}

/**
 * Counts the plans the users created, per user and per week. Left out of every
 * count: the plans created before the tracking began, which carry no date, and
 * those of the accounts not ticked « Utilisateur Approbiom », such as the
 * administrators' and the service accounts', whose use is not what is tracked.
 */
export function suivreCreations(
    plans: readonly Creation[],
    comptes: readonly Compte[]
): SuiviCreations {
    const utilisateurs = emailsDesUtilisateurs(comptes)

    const suivies = plans.flatMap(({ createdBy, createdAt }) => {
        const utilisateur =
            createdBy === null ? null : normaliserEmail(createdBy)

        return createdAt !== null &&
            utilisateur !== null &&
            utilisateurs.has(utilisateur)
            ? [{ utilisateur, createdAt }]
            : []
    })
    if (suivies.length === 0)
        return {
            lignes: [],
            totalPlans: 0,
            premiereCreation: null,
            nombreCreateurs: 0,
            nombreUtilisateurs: utilisateurs.size,
        }

    const parSemaine = new Map<Semaine, Map<string, number>>()
    for (const { utilisateur, createdAt } of suivies) {
        const semaine = semaineDe(createdAt)
        const parUtilisateur =
            parSemaine.get(semaine) ?? new Map<string, number>()
        parUtilisateur.set(
            utilisateur,
            (parUtilisateur.get(utilisateur) ?? 0) + 1
        )
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
                b.plans - a.plans ||
                a.utilisateur.localeCompare(b.utilisateur, 'fr')
        )

    return {
        lignes,
        totalPlans: suivies.length,
        premiereCreation: new Date(
            Math.min(...suivies.map(({ createdAt }) => createdAt.getTime()))
        ),
        nombreCreateurs: new Set(suivies.map(({ utilisateur }) => utilisateur))
            .size,
        nombreUtilisateurs: utilisateurs.size,
    }
}

/**
 * Share of the users who created at least one plan, from 0 to 1. Unknown while
 * no account is ticked « Utilisateur Approbiom ».
 */
export const partDesCreateurs = ({
    nombreCreateurs,
    nombreUtilisateurs,
}: Pick<SuiviCreations, 'nombreCreateurs' | 'nombreUtilisateurs'>):
    number | null =>
    nombreUtilisateurs === 0 ? null : nombreCreateurs / nombreUtilisateurs
