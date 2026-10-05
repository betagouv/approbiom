import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'

const ANNUAIRE_URL = 'https://annuaire-entreprises.data.gouv.fr'

export const annuaireSearchUrl = (query: string) =>
    `${ANNUAIRE_URL}/rechercher?${new URLSearchParams({ terme: query }).toString()}`

// The address the Annuaire redirects to: the name in lowercase, without
// accents, every run of other characters (spaces, parentheses, &, ') turned
// into one dash, then the SIREN — the first 9 digits of the SIRET.
export function annuaireEntrepriseUrl({
    denomination,
    siret,
}: FoundEntreprise): string {
    const name = denomination
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    return `${ANNUAIRE_URL}/entreprise/${name}-${siret.slice(0, 9)}`
}
