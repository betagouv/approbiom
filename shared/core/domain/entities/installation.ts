import type { Commune } from '../value-objects/commune'

export type Installation = {
    id: number
    commune: Commune['codeInsee']
}
