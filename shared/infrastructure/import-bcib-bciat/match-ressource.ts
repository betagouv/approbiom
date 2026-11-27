import type { Ressource } from '@shared/core/domain/value-objects/ressource'
import { findMostSpecificInText } from './find-in-text'

export function matchRessource<
    R extends Pick<Ressource, 'ademeCode' | 'code' | 'description'>,
>(rawResource: string, ressources: readonly R[]): R | null {
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
