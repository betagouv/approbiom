import type { Instruction } from '@shared/core/domain/entities/instruction'

export interface InstructionPort {
    list(): Promise<readonly Instruction[]>
    update(
        instructionId: Instruction['id'],
        updateData: Partial<Pick<Instruction, 'avisCRB'>>
    ): Promise<Instruction>
}
