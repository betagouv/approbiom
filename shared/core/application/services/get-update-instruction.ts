import type { InstructionPort } from '@shared/core/application/ports/instruction'

export type UpdateInstructionPorts = {
    instructions: InstructionPort
}

export type UpdateInstruction = InstructionPort['update']

export function getUpdateInstruction({
    instructions,
}: UpdateInstructionPorts): UpdateInstruction {
    return (instructionId, updateData) =>
        instructions.update(instructionId, updateData)
}
