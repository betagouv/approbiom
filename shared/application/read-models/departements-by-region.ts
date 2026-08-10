import type { Departement } from '@shared/domain/departement'
import type { Region } from '@shared/domain/region'

export type DepartementsByRegion = {
    region: Pick<Region, 'libelle' | 'reg'>
    departements: readonly Pick<Departement, 'dep'>[]
}
