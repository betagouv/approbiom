import type { Region } from '@shared/core/domain/value-objects/region'

export type Departement = {
    dep: string
    libelle: string
    reg: Region['reg']
}
