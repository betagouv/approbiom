import type { Installation } from '@shared/core/domain/entities/installation'

/**
 * The installation directory. A plan references an installation, and the
 * installation is what carries a commune — so this is the hop between a plan
 * and where it sits.
 */
export interface InstallationQuery {
    list(): Promise<readonly Installation[]>
}
