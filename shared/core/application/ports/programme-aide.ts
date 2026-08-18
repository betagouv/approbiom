import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

export interface ProgrammeAideQuery {
    list(): Promise<readonly ProgrammeAide[]>
}
