import type { Departement } from './departement'

export type Commune = {
    com: string
    libelle: string
    dep: Departement['dep']
}
