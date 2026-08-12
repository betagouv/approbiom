import type { Instruction } from '@shared/application/domain/instruction'

export interface InstructionQuery {
    list(): Promise<readonly Instruction[]>
}
