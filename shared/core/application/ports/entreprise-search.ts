import type { Entreprise } from '@shared/core/domain/entities/entreprise'

// Where the entreprise stands in the répertoire SIRENE, in the Annuaire des
// Entreprises' words: a cessée entreprise has closed as a whole; an active one
// can still have closed the very établissement found. `depuis` is the closing
// date (YYYY-MM-DD), when SIRENE knows it.
export type EtatAdministratif =
    | { etat: 'en-activite' }
    | { etat: 'cessee'; depuis: string | null }
    | { etat: 'etablissement-ferme'; depuis: string | null }

export type FoundEntreprise = Pick<Entreprise, 'siret' | 'denomination'> & {
    etatAdministratif: EtatAdministratif
    // The postal address of the établissement found, on one line.
    adresse: string
}

export interface EntrepriseSearchPort {
    // Empty when nothing matches the query.
    getEntrepriseFromQuery(query: string): Promise<FoundEntreprise[]>
}
