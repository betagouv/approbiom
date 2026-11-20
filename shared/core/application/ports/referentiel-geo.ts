import type { Commune } from '@shared/core/domain/value-objects/commune'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Region } from '@shared/core/domain/value-objects/region'

export interface ReferentielGeoPort {
    listDepartementsByRegion: () => Promise<readonly DepartementsByRegion[]>
    /**
     * The centre of a commune, or `undefined` when the référentiel does not
     * hold its code: a document can name a commune the bundled dataset lacks,
     * and a screen should leave it off the map rather than fail.
     */
    getCommuneCenterPosition: (codeCommune: Commune['codeInsee']) =>
        | {
              latitude: number
              longitude: number
          }
        | undefined
    /** The outline of a département, or none when its code is not held. */
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
