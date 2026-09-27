import type { Entreprise } from '@shared/core/domain/entities/entreprise'

// Lowercase words without accents, separated by single spaces: punctuation
// counts as a separator, so « SAS DUPONT & FILS » reads « sas dupont fils ».
function normalizeWords(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

function digitsOf(value: string): string {
    return value.replace(/\D/g, '')
}

function containsWords(text: string, words: string): boolean {
    return words !== '' && ` ${text} `.includes(` ${words} `)
}

// The entreprise whose whole denomination appears in the raw supplier. When
// several do, the longest denomination is the most specific one.
function findByDenomination(
    rawSupplier: string,
    entreprises: readonly Entreprise[]
): Entreprise | undefined {
    const supplier = normalizeWords(rawSupplier)

    return entreprises
        .filter((entreprise) =>
            containsWords(supplier, normalizeWords(entreprise.denomination))
        )
        .sort(
            (a, b) =>
                normalizeWords(b.denomination).length -
                normalizeWords(a.denomination).length
        )[0]
}

export function matchFournisseur(
    rawSupplier: string,
    entreprises: readonly Entreprise[]
): Entreprise | null {
    const byDenomination = findByDenomination(rawSupplier, entreprises)
    if (byDenomination) return byDenomination

    const siret = digitsOf(rawSupplier)
    const bySiret = entreprises.find(
        (entreprise) => siret !== '' && digitsOf(entreprise.siret) === siret
    )

    return bySiret ?? null
}
