import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { Utilisateur } from '@shared/core/domain/entities/utilisateur'

/**
 * A Paris-time week named by its Monday (`YYYY-MM-DD`), like Grist's
 * `Cree_la_semaine` column.
 */
export type Semaine = string

export type CreationsDeLaSemaine = {
    semaine: Semaine
    /** Lower-cased email. */
    utilisateur: string
    plans: number
}

export type Creation = Pick<Plan, 'createdBy' | 'createdAt'>

export type Compte = Pick<Utilisateur, 'email' | 'utilisateurApprobiom'>

export type UtilisateursDeLaSemaine = {
    semaine: Semaine
    utilisateurs: number
}

export type SuiviCreations = {
    /** Most recent week first, then most plans. */
    lignes: readonly CreationsDeLaSemaine[]
    /** Oldest first, from the first creation to now, including weeks at 0. */
    semaines: readonly UtilisateursDeLaSemaine[]
    cetteSemaine: UtilisateursDeLaSemaine
    totalPlans: number
    premiereCreation: Date | null
    nombreCreateurs: number
    /** Accounts ticked « Utilisateur Approbiom ». */
    nombreUtilisateurs: number
}

const PARIS = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
})

/**
 * The Paris day as midnight UTC, so a day is always 24 hours whatever DST does.
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

const normaliserEmail = (email: string): string => email.trim().toLowerCase()

function emailsDesUtilisateurs(comptes: readonly Compte[]): Set<string> {
    return new Set(
        comptes.flatMap(({ email, utilisateurApprobiom }) => {
            const adresse = normaliserEmail(email)
            return utilisateurApprobiom && adresse !== '' ? [adresse] : []
        })
    )
}

/**
 * Grist started recording plan creators and dates in October 2026: earlier
 * dates are not tracked.
 */
export const DEBUT_DU_SUIVI: Semaine = '2026-10-05'

const semaineSuivante = (semaine: Semaine): Semaine =>
    ajouterJours(new Date(semaine), 7).toISOString().slice(0, 10)

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
 * Only counts tracked plans by accounts ticked « Utilisateur Approbiom » (not
 * admins or service accounts).
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
                b.semaine.localeCompare(a.semaine) ||
                b.plans - a.plans ||
                a.utilisateur.localeCompare(b.utilisateur, 'fr')
        )

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
            // A plan dated after this week (clock ahead of the widget's) still
            // shows.
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

/** From 0 to 1; null while no account is ticked « Utilisateur Approbiom ». */
export const partDesCreateurs = ({
    nombreCreateurs,
    nombreUtilisateurs,
}: Pick<SuiviCreations, 'nombreCreateurs' | 'nombreUtilisateurs'>):
    number | null =>
    nombreUtilisateurs === 0 ? null : nombreCreateurs / nombreUtilisateurs
