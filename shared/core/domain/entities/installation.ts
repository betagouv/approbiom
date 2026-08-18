import type { Commune } from '@shared/core/domain/value-objects/commune'

export type Installation = {
    id: number
    nom: string
    commune: Commune
}
