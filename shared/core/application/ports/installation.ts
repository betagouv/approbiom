import type { Installation } from '@shared/core/domain/entities/installation'

export interface InstallationPort {
    list(): Promise<readonly Installation[]>
}
