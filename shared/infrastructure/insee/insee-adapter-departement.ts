import type { InseePort } from '@shared/core/application/ports/insee'
import type { Departement } from '@shared/core/domain/value-objects/departement'
import dataset from './departements-contours.json'

type DepartementsDataset = {
    departements: Record<Departement['dep'], DepartementRecord | undefined>
}

type Latitude = number
type Longitude = number

type DepartementRecord = {
    nom: Departement['libelle']
    contour: [Latitude, Longitude][][]
}

const { departements } = dataset as unknown as DepartementsDataset

export function createInseeDepartementAdapter(): Pick<
    InseePort,
    'getDepartementContour'
> {
    return {
        getDepartementContour(codeDepartement) {
            const departement = departements[codeDepartement]
            if (departement === undefined) {
                throw new Error(
                    `no département carries the code "${codeDepartement}"`
                )
            }

            return departement.contour.map((ring) =>
                ring.map(([latitude, longitude]) => ({ latitude, longitude }))
            )
        },
    }
}
