import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { findMostSpecificInText } from './find-in-text'

function digitsOf(value: string): string {
    return value.replace(/\D/g, '')
}

export function matchFournisseur(
    rawSupplier: string,
    entreprises: readonly Entreprise[]
): Entreprise | null {
    const byDenomination = findMostSpecificInText(
        rawSupplier,
        entreprises,
        (entreprise) => entreprise.denomination
    )
    if (byDenomination) return byDenomination

    const siret = digitsOf(rawSupplier)
    const bySiret = entreprises.find(
        (entreprise) => siret !== '' && digitsOf(entreprise.siret) === siret
    )

    return bySiret ?? null
}
