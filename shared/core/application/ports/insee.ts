import type { Commune } from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Region } from '@shared/core/domain/value-objects/region'

export interface InseePort {
    listDepartementsByRegion(): Promise<readonly DepartementsByRegion[]>
    getCommuneCenterPosition(codeCommune: Commune['codeInsee']): {
        latitude: number
        longitude: number
    }
    getDepartementContour(codeDepartement: Departement['dep']): {
        latitude: number
        longitude: number
    }[][]
}

export type DepartementsByRegion = {
    region: Pick<Region, 'libelle' | 'reg'>
    departements: readonly Pick<Departement, 'dep' | 'libelle'>[]
}
