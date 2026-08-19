import type { Instruction } from '@shared/core/domain/entities/instruction'

export interface InstructionPort {
    list(): Promise<readonly Instruction[]>
}
