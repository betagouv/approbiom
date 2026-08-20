import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

export type ProgrammeAideUpdateData = Partial<Pick<ProgrammeAide, 'laureat'>>

export interface ProgrammeAidePort {
    list(): Promise<readonly ProgrammeAide[]>
    update(
        programmeAideId: ProgrammeAide['id'],
        updateData: ProgrammeAideUpdateData
    ): Promise<ProgrammeAide>
}
