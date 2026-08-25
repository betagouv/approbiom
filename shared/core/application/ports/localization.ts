import type { Commune } from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Region } from '@shared/core/domain/value-objects/region'

export interface LocalizationPort {
    listDepartementsByRegion: () => Promise<readonly DepartementsByRegion[]>
    getCommuneCenterPosition: (codeCommune: Commune['codeInsee']) => {
        latitude: number
        longitude: number
    }
    getDepartementContour: (codeDepartement: Departement['dep']) => {
        latitude: number
        longitude: number
    }[][]

    getCountryContour: (libelle: Pays['libelle']) => {
        latitude: number
        longitude: number
    }[][]
}

export type DepartementsByRegion = {
    region: Pick<Region, 'libelle' | 'reg'>
    departements: readonly Pick<Departement, 'dep' | 'libelle'>[]
}
