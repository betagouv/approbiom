import type { Departement } from '@shared/application/domain/departement'
import type { Region } from '@shared/application/domain/region'

export type DepartementsByRegion = {
    region: Pick<Region, 'libelle' | 'reg'>
    departements: readonly Pick<Departement, 'dep' | 'libelle'>[]
}
