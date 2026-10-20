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

/** How many users created at least one plan in a week. */
export type UtilisateursDeLaSemaine = {
    semaine: Semaine
    utilisateurs: number
}

export type SuiviCreations = {
    /**
     * One line per user and per week they created a plan in: the most recent
     * week first, then the most plans.
     */
    lignes: readonly CreationsDeLaSemaine[]
    /**
     * Every week from the first creation to the current one, the oldest first:
     * a week without any creation is there too, at 0. Empty until a user
     * creates a plan.
     */
    semaines: readonly UtilisateursDeLaSemaine[]
    /** The week under way, even when no one has created a plan in it yet. */
    cetteSemaine: UtilisateursDeLaSemaine
    /** Plans the users created since the tracking began. */
    totalPlans: number
    premiereCreation: Date | null
    /** Users who created at least one plan since the tracking began. */
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
 * The week the tracking begins, the first week of October 2026: Grist started
 * recording that month who created a plan, and when. A plan dated earlier did
 * not get its date from the tracking, and is left out like the plans made
 * before it, which carry none.
 */
export const DEBUT_DU_SUIVI: Semaine = '2026-10-05'

const semaineSuivante = (semaine: Semaine): Semaine =>
    ajouterJours(new Date(semaine), 7).toISOString().slice(0, 10)

/** Each week from `premiere` to `derniere`, both included, in order. */
function semainesEntre(premiere: Semaine, derniere: Semaine): Semaine[] {
    const semaines: Semaine[] = []
    // ISO dates compare as text, so this is a chronological order.
    for (
        let semaine = premiere;
        semaine <= derniere;
        semaine = semaineSuivante(semaine)
    )
        semaines.push(semaine)
    return semaines
}

/**
 * Counts the plans the users created, per user and per week, and how many
 * users were active each week, from the start of the tracking up to the week
 * `maintenant` falls in. Left out of every count: the plans created before the
 * tracking began, and those of the accounts not ticked « Utilisateur
 * Approbiom », such as the administrators' and the service accounts', whose
 * use is not what is tracked.
 */
export function suivreCreations(
    plans: readonly Creation[],
    comptes: readonly Compte[],
    maintenant: Date
): SuiviCreations {
    const utilisateurs = emailsDesUtilisateurs(comptes)
    const semaineEnCours = semaineDe(maintenant)

    const suivies = plans.flatMap(({ createdBy, createdAt }) => {
        if (createdAt === null || createdBy === null) return []

        const utilisateur = normaliserEmail(createdBy)
        const semaine = semaineDe(createdAt)

        return semaine >= DEBUT_DU_SUIVI && utilisateurs.has(utilisateur)
            ? [{ utilisateur, semaine, createdAt }]
            : []
    })
    if (suivies.length === 0)
        return {
            lignes: [],
            semaines: [],
            cetteSemaine: { semaine: semaineEnCours, utilisateurs: 0 },
            totalPlans: 0,
            premiereCreation: null,
            nombreCreateurs: 0,
            nombreUtilisateurs: utilisateurs.size,
        }

    const parSemaine = new Map<Semaine, Map<string, number>>()
    for (const { utilisateur, semaine } of suivies) {
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

    // A user counts once in a week, however many plans they created in it.
    const actifs = (semaine: Semaine): UtilisateursDeLaSemaine => ({
        semaine,
        utilisateurs: parSemaine.get(semaine)?.size ?? 0,
    })
    // `lignes` holds the weeks with a creation, the most recent first.
    const premiere = lignes[lignes.length - 1].semaine
    const derniere = lignes[0].semaine

    return {
        lignes,
        semaines: semainesEntre(
            premiere,
            // A plan dated past this week, by a clock ahead of the widget's,
            // still shows.
            derniere > semaineEnCours ? derniere : semaineEnCours
        ).map(actifs),
        cetteSemaine: actifs(semaineEnCours),
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
 * Share of the users who created at least one plan since the tracking began,
 * from 0 to 1. Unknown while no account is ticked « Utilisateur Approbiom ».
 */
export const partDesCreateurs = ({
    nombreCreateurs,
    nombreUtilisateurs,
}: Pick<SuiviCreations, 'nombreCreateurs' | 'nombreUtilisateurs'>):
    number | null =>
    nombreUtilisateurs === 0 ? null : nombreCreateurs / nombreUtilisateurs
