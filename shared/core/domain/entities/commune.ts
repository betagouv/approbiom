import type { Departement } from '../value-objects/departement'

export type Commune = {
    com: string
    libelle: string
    dep: Departement['dep']
}
