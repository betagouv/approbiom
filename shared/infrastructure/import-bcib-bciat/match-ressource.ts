import type { Ressource } from '@shared/core/domain/entities/ressource'
import { findMostSpecificInText } from './find-in-text'

export function matchRessource(
    rawResource: string,
    ressources: readonly Ressource[]
): Ressource | null {
    return (
        findMostSpecificInText(
            rawResource,
            ressources,
            (ressource) => ressource.ademeCode
        ) ??
        findMostSpecificInText(
            rawResource,
            ressources,
            (ressource) => ressource.code
        ) ??
        findMostSpecificInText(
            rawResource,
            ressources,
            (ressource) => ressource.description
        ) ??
        null
    )
}
