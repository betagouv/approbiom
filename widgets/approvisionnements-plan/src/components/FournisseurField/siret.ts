import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import {
    digitsOf,
    validateSiret,
    type SiretProblem,
} from '@shared/core/domain/value-objects/siret'

export const isNumericQuery = (text: string) => /^\d+$/.test(digitsOf(text))

export type SiretCheck =
    | { ok: true; siret: string }
    | {
          ok: false
          error: string
          immediate: boolean
          duplicate?: Entreprise
      }

const MESSAGES: Record<
    SiretProblem,
    (digitCount: number) => { error: string; immediate: boolean }
> = {
    'not-digits': () => ({
        error: 'Le SIRET ne doit contenir que des chiffres.',
        immediate: true,
    }),
    empty: () => ({
        error: 'Renseignez le SIRET du fournisseur.',
        immediate: false,
    }),
    'too-short': (count) => ({
        error: `Le SIRET doit contenir 14 chiffres (${count} saisi${count > 1 ? 's' : ''}).`,
        immediate: false,
    }),
    'too-long': (count) => ({
        error: `Le SIRET doit contenir 14 chiffres (${count} saisis).`,
        immediate: true,
    }),
}

export function checkSiret(
    raw: string,
    entreprises: readonly Entreprise[]
): SiretCheck {
    const validation = validateSiret(raw)
    if (!validation.ok)
        return {
            ok: false,
            ...MESSAGES[validation.problem](validation.digitCount),
        }

    const duplicate = entreprises.find(
        ({ siret }) => siret === validation.siret
    )
    if (duplicate)
        return {
            ok: false,
            error: `Ce SIRET est déjà utilisé par le fournisseur « ${duplicate.denomination} ».`,
            immediate: true,
            duplicate,
        }

    return validation
}
