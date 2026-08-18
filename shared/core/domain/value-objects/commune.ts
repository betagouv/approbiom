import type { Departement } from '@shared/core/domain/value-objects/departement'

export type Commune = {
    com: string
    libelle: string
    dep: Departement['dep']
}
