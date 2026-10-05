import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export const digitsOf = (text: string) => text.replace(/\s/g, '')

export const isNumericQuery = (text: string) => /^\d+$/.test(digitsOf(text))

// « 412 345 678 00019 »: the SIREN in threes, then the NIC.
export function formatSiret(digits: string): string {
    return [
        digits.slice(0, 3),
        digits.slice(3, 6),
        digits.slice(6, 9),
        digits.slice(9),
    ]
        .filter(Boolean)
        .join(' ')
}

export type SiretCheck =
    | { ok: true; siret: string }
    | {
          ok: false
          error: string
          // Shown as soon as it holds, rather than once the field is left.
          immediate: boolean
          duplicate?: Entreprise
      }

// The rules in the order they are checked.
export function checkSiret(
    raw: string,
    entreprises: readonly Entreprise[]
): SiretCheck {
    const digits = digitsOf(raw)

    if (/\D/.test(digits))
        return {
            ok: false,
            error: 'Le SIRET ne doit contenir que des chiffres.',
            immediate: true,
        }
    if (!digits)
        return {
            ok: false,
            error: 'Renseignez le SIRET du fournisseur.',
            immediate: false,
        }
    if (digits.length !== 14)
        return {
            ok: false,
            error: `Le SIRET doit contenir 14 chiffres (${digits.length} saisi${digits.length > 1 ? 's' : ''}).`,
            immediate: digits.length > 14,
        }

    const duplicate = entreprises.find(({ siret }) => siret === digits)
    if (duplicate)
        return {
            ok: false,
            error: `Ce SIRET est déjà utilisé par le fournisseur « ${duplicate.denomination} ».`,
            immediate: true,
            duplicate,
        }

    return { ok: true, siret: digits }
}
