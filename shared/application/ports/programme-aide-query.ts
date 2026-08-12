import type { ProgrammeAide } from '@shared/application/domain/programme-aide'

export interface ProgrammeAideQuery {
    list(): Promise<readonly ProgrammeAide[]>
}
