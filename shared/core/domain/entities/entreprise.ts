import type { Siret } from '@shared/core/domain/value-objects/siret'

export type Entreprise = {
    denomination: string
    siret: Siret
}
