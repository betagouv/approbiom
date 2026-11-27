import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Siret } from '@shared/core/domain/value-objects/siret'

export type SiretLookup =
    | { status: 'found'; denomination: Entreprise['denomination'] }
    | { status: 'notfound' }

const TIMEOUT_MS = 6000

// A SIRET search can answer with other establishments. Rejects on failure or timeout.
export async function findEntrepriseBySiret(
    siret: Siret,
    search: EntrepriseSearchPort['getEntrepriseFromQuery'],
    timeoutMs = TIMEOUT_MS
): Promise<SiretLookup> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
            () => reject(new Error('La recherche a pris trop de temps.')),
            timeoutMs
        )
    })

    try {
        const { entreprises } = await Promise.race([search(siret), timeout])
        const found = entreprises.find((result) => result.siret === siret)

        return found
            ? { status: 'found', denomination: found.denomination }
            : { status: 'notfound' }
    } finally {
        clearTimeout(timer)
    }
}
