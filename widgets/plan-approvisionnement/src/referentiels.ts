import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'

// The reference lists loaded once, which names and choices are taken from.
export type Referentiels = {
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
    departementsByRegion: readonly DepartementsByRegion[]
}
