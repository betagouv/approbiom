import type { FoundEntreprise } from '@shared/core/application/ports/entreprise-search'

const ANNUAIRE_URL = 'https://annuaire-entreprises.data.gouv.fr'

export const annuaireSearchUrl = (query: string) =>
    `${ANNUAIRE_URL}/rechercher?${new URLSearchParams({ terme: query }).toString()}`

// Matches the address the Annuaire redirects to; the SIREN is the first 9 digits of the SIRET.
export function annuaireEntrepriseUrl({
    denomination,
    siret,
}: Pick<FoundEntreprise, 'denomination' | 'siret'>): string {
    const name = denomination
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    return `${ANNUAIRE_URL}/entreprise/${name}-${siret.slice(0, 9)}`
}
