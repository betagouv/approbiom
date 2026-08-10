import type { Region } from './region'

export type Departement = {
    dep: string
    libelle: string
    reg: Region['reg']
}
