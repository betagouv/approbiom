/**
 * The number INSEE gives an établissement: the 9-digit SIREN of its entreprise,
 * then a 5-digit NIC. Held as its 14 digits, with no spaces.
 */
export type Siret = string

const LENGTH = 14

/** What was typed, spaces left out: « 412 345 678 00019 » is a SIRET too. */
export const digitsOf = (text: string): string => text.replace(/\s/g, '')

/** Why a text is not a SIRET, in the order the rules are checked. */
export type SiretProblem = 'not-digits' | 'empty' | 'too-short' | 'too-long'

export type SiretValidation =
    | { ok: true; siret: Siret }
    // How many digits there are, for a length that is wrong.
    | { ok: false; problem: SiretProblem; digitCount: number }

export function validateSiret(text: string): SiretValidation {
    const digits = digitsOf(text)
    const fail = (problem: SiretProblem) =>
        ({ ok: false, problem, digitCount: digits.length }) as const

    if (/\D/.test(digits)) return fail('not-digits')
    if (!digits) return fail('empty')
    if (digits.length < LENGTH) return fail('too-short')
    if (digits.length > LENGTH) return fail('too-long')

    return { ok: true, siret: digits }
}

/** « 412 345 678 00019 »: the SIREN in threes, then the NIC. Takes a SIRET
 *  being typed as well. */
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
