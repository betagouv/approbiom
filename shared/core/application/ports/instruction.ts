import type { Instruction } from '@shared/core/domain/entities/instruction'

export interface InstructionQuery {
    list(): Promise<readonly Instruction[]>
}
