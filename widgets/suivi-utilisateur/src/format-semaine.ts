import type { Semaine } from './suivi-creations'

// A `Semaine` is midnight UTC: format in UTC so no time zone moves it to the
// day before.
const formatLundi = (options: Intl.DateTimeFormatOptions) => {
    const format = new Intl.DateTimeFormat('fr-FR', {
        ...options,
        timeZone: 'UTC',
    })
    return (semaine: Semaine): string => format.format(new Date(semaine))
}

/** « 19 octobre 2026 » */
export const lundiLong = formatLundi({ dateStyle: 'long' })

/** « 19 oct. » */
export const lundiCourt = formatLundi({ day: 'numeric', month: 'short' })

/** « 19/10/2026 » */
export const lundiNumerique = formatLundi({ dateStyle: 'short' })
