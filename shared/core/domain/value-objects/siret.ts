export type Siret = string

const LENGTH = 14

export const digitsOf = (text: string): string => text.replace(/\s/g, '')

export type SiretProblem = 'not-digits' | 'empty' | 'too-short' | 'too-long'

export type SiretValidation =
    | { ok: true; siret: Siret }
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
