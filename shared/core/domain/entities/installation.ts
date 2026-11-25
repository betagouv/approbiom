import type { Commune } from '../value-objects/commune'

export type Installation = {
    id: number
    nom: string
    commune: Commune['codeInsee']
}
