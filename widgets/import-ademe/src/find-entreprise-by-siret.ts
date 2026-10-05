import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'

export type SiretLookup =
    | { status: 'found'; denomination: Entreprise['denomination'] }
    | { status: 'notfound' }

const TIMEOUT_MS = 6000

// A search on a SIRET can still answer with other establishments: only one
// carrying that very SIRET counts. Rejects when the service fails or is too
// slow, which is not the same as finding nothing.
export async function findEntrepriseBySiret(
    siret: Entreprise['siret'],
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
        const results = await Promise.race([search(siret), timeout])
        const found = results.find((result) => result.siret === siret)

        return found
            ? { status: 'found', denomination: found.denomination }
            : { status: 'notfound' }
    } finally {
        clearTimeout(timer)
    }
}
