import type { Crb } from '@shared/core/domain/entities/crb'

export interface CrbPort {
    list(): Promise<readonly Crb[]>
}
