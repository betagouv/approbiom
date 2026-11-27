import type { Entreprise } from '@shared/core/domain/entities/entreprise'

// Per SIRENE: an active entreprise can still have closed the établissement found.
// `depuis` is the closing date (YYYY-MM-DD), when known.
export type EtatAdministratif =
    | { etat: 'en-activite' }
    | { etat: 'cessee'; depuis: string | null }
    | { etat: 'etablissement-ferme'; depuis: string | null }

export type FoundEntreprise = Pick<Entreprise, 'siret' | 'denomination'> & {
    etatAdministratif: EtatAdministratif
    // Of the établissement found, on one line.
    adresse: string
}

// Past a ceiling the API stops counting: `atLeast` then means there may be more.
export type EntrepriseSearchTotal = { count: number; atLeast: boolean }

export type EntrepriseSearchResult = {
    entreprises: FoundEntreprise[]
    total: EntrepriseSearchTotal
}

export interface EntrepriseSearchPort {
    getEntrepriseFromQuery(query: string): Promise<EntrepriseSearchResult>
}
