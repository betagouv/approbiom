import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Region } from '@shared/core/domain/value-objects/region'

export interface InseeQuery {
    listDepartementsByRegion(): Promise<readonly DepartementsByRegion[]>
}

export type DepartementsByRegion = {
    region: Pick<Region, 'libelle' | 'reg'>
    departements: readonly Pick<Departement, 'dep' | 'libelle'>[]
}
