import type { Instruction } from '@shared/core/domain/entities/instruction'

export type InstructionUpdateData = Partial<
    Pick<Instruction, 'avisCRB' | 'avisPrefet' | 'avisCrbRequis'>
>

export interface InstructionPort {
    list(): Promise<readonly Instruction[]>
    update(
        instructionId: Instruction['id'],
        updateData: InstructionUpdateData
    ): Promise<Instruction>
}
