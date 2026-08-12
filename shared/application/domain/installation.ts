import type { Commune } from './commune'

export type Installation = {
    id: number
    nom: string
    commune: Commune
}
