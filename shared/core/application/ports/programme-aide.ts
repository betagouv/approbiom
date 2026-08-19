import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

export interface ProgrammeAidePort {
    list(): Promise<readonly ProgrammeAide[]>
}
