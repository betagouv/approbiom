import './TabUpdate.css'

import { useState } from 'react'
import Select from '@shared/react/components/Select'

import Toggle from '@shared/react/components/Toggle'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import {
    AVIS_CRB,
    type AvisCRB,
} from '@shared/core/domain/value-objects/avis-crb'
import {
    AVIS_PREFET,
    type AvisPrefet,
} from '@shared/core/domain/value-objects/avis-prefet'

const AVIS_CRB_OPTIONS = AVIS_CRB.map((avis) => ({ value: avis, label: avis }))
const AVIS_PREFET_OPTIONS = AVIS_PREFET.map((avis) => ({
    value: avis,
    label: avis,
}))

type InstructionUpdate = Pick<
    Instruction,
    'avisCRB' | 'avisCrbRequis' | 'avisPrefet' | 'phase' | 'crb'
>

type DemandeUpdate = {
    id: DemandeSubvention['id']
    programmeAide: Pick<ProgrammeAide, 'shortName' | 'laureat'>
    instructions: readonly InstructionUpdate[]
}

type Props = {
    demandesSubvention: readonly DemandeUpdate[]
}

// What the user has changed but not yet saved. It is held apart from the props
// rather than written over them: the props stay the stored state, which is what
// the « lauréat » tag keeps reporting while the switch beside it moves.
type InstructionDraft = Pick<
    Instruction,
    'avisCRB' | 'avisCrbRequis' | 'avisPrefet'
>

type Draft = {
    laureat: Record<string, boolean>
    instructions: Record<string, InstructionDraft>
}

// An instruction carries no id of its own, so its position within its demande
// is what names it. That holds because the list is only ever read, never
// reordered — and both are scoped by the demande, so two programmes cannot
// collide.
function instructionKey(demande: DemandeUpdate['id'], index: number) {
    return `${demande}-${index}`
}

function buildDraft(demandesSubvention: readonly DemandeUpdate[]): Draft {
    const draft: Draft = { laureat: {}, instructions: {} }

    for (const demande of demandesSubvention) {
        draft.laureat[demande.id] = demande.programmeAide.laureat !== null

        demande.instructions.forEach((instruction, index) => {
            draft.instructions[instructionKey(demande.id, index)] = {
                avisCrbRequis: instruction.avisCrbRequis,
                avisCRB: instruction.avisCRB,
                avisPrefet: instruction.avisPrefet,
            }
        })
    }

    return draft
}

const TabUpdate = ({ demandesSubvention }: Props) => {
    // Seeded once, from the props as they arrive. Nothing resets it afterwards
    // and nothing has to: `Dossier` is keyed by plan id in App.tsx, so opening
    // another dossier mounts another tab and seeds another draft.
    const [draft, setDraft] = useState<Draft>(() =>
        buildDraft(demandesSubvention)
    )

    function setLaureat(id: DemandeUpdate['id'], laureat: boolean) {
        setDraft((current) => ({
            ...current,
            laureat: { ...current.laureat, [id]: laureat },
        }))
    }

    function updateInstruction(
        key: string,
        changes: Partial<InstructionDraft>
    ) {
        setDraft((current) => ({
            ...current,
            instructions: {
                ...current.instructions,
                [key]: { ...current.instructions[key], ...changes },
            },
        }))
    }

    if (demandesSubvention.length === 0) {
        return (
            <p className="fr-text--sm">
                Aucune demande de subvention n&apos;a été renseignée pour ce
                plan.
            </p>
        )
    }

    return (
        <div className="tab-update">
            {demandesSubvention.map((demande) => (
                <section key={demande.id} className="tab-update__demande">
                    <header className="tab-update__entete">
                        <div className="tab-update__programme">
                            <p className="tab-update__surtitre">
                                Programme d&apos;aide
                            </p>
                            <h2 className="fr-h5 tab-update__titre">
                                {demande.programmeAide.shortName}
                            </h2>
                        </div>
                        <div className="tab-update__laureat">
                            <Toggle
                                label="Ce plan est lauréat"
                                labelLeft
                                checked={draft.laureat[demande.id]}
                                onChange={(laureat) =>
                                    setLaureat(demande.id, laureat)
                                }
                            />
                        </div>
                    </header>

                    {demande.instructions.length === 0 ? (
                        <p className="fr-text--sm tab-update__vide">
                            Aucune instruction n&apos;a été renseignée pour
                            cette demande de subvention.
                        </p>
                    ) : (
                        demande.instructions.map((instruction, index) => {
                            const key = instructionKey(demande.id, index)
                            const edited = draft.instructions[key]

                            return (
                                <article
                                    key={key}
                                    className="tab-update__instruction"
                                >
                                    <div className="tab-update__instruction-entete">
                                        <p className="tab-update__instruction-titre">
                                            Instruit par {instruction.crb}
                                        </p>
                                        <p className="tab-update__phase">
                                            Phase de
                                            l&apos;instruction&nbsp;:&nbsp;
                                            {instruction.phase}
                                        </p>
                                    </div>

                                    <div className="tab-update__champs">
                                        <Toggle
                                            label="Avis CRB requis"
                                            labelLeft
                                            checked={edited.avisCrbRequis}
                                            onChange={(avisCrbRequis) =>
                                                updateInstruction(key, {
                                                    avisCrbRequis,
                                                })
                                            }
                                        />
                                        {edited.avisCrbRequis && (
                                            <Select<AvisCRB>
                                                label="Avis CRB"
                                                options={AVIS_CRB_OPTIONS}
                                                value={edited.avisCRB}
                                                onChange={(avisCRB) =>
                                                    updateInstruction(key, {
                                                        avisCRB,
                                                    })
                                                }
                                            />
                                        )}
                                        <Select<AvisPrefet>
                                            label="Avis Préfet"
                                            options={AVIS_PREFET_OPTIONS}
                                            value={edited.avisPrefet}
                                            onChange={(avisPrefet) =>
                                                updateInstruction(key, {
                                                    avisPrefet,
                                                })
                                            }
                                        />
                                    </div>
                                </article>
                            )
                        })
                    )}
                </section>
            ))}
        </div>
    )
}

export default TabUpdate
