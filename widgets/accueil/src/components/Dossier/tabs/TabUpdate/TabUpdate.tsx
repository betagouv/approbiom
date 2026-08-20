import './TabUpdate.css'

import Select from '@shared/react/components/Select'

import Toggle from '@shared/react/components/Toggle'
import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'

import type { InstructionDetail } from '@shared/core/application/services/plan-detail'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import {
    AVIS_CRB,
    type AvisCRB,
} from '@shared/core/domain/value-objects/avis-crb'
import {
    AVIS_PREFET,
    type AvisPrefet,
} from '@shared/core/domain/value-objects/avis-prefet'
import type { InstructionUpdateData } from '@shared/core/application/ports/instruction'
import type { UpdateInstruction } from '@shared/core/application/services/get-update-instruction'

const AVIS_CRB_OPTIONS = AVIS_CRB.map((avis) => ({ value: avis, label: avis }))
const AVIS_PREFET_OPTIONS = AVIS_PREFET.map((avis) => ({
    value: avis,
    label: avis,
}))

type InstructionUpdate = Pick<
    InstructionDetail,
    'id' | 'avisCRB' | 'avisCrbRequis' | 'avisPrefet' | 'phase' | 'crbName'
>

type DemandeUpdate = {
    id: DemandeSubvention['id']
    programmeAide: Pick<ProgrammeAide, 'shortName' | 'laureat'>
    instructions: readonly InstructionUpdate[]
}

type Props = {
    demandesSubvention: readonly DemandeUpdate[]
    updateInstruction: UpdateInstruction
    refresh: () => void
}

const TabUpdate = ({
    demandesSubvention,
    updateInstruction,
    refresh,
}: Props) => {
    const onUpdateInstruction = (
        instructionId: InstructionUpdate['id'],
        updateData: InstructionUpdateData
    ) =>
        void updateInstruction(instructionId, updateData).then(
            refresh,
            // A refused write leaves the document as it was, so there is
            // nothing to read back.
            () => {}
        )

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
                                checked={true}
                                onChange={() => ''}
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
                            return (
                                <article
                                    key={index}
                                    className="tab-update__instruction"
                                >
                                    <div className="tab-update__instruction-entete">
                                        <p className="tab-update__instruction-titre">
                                            Instruit par {instruction.crbName}
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
                                            checked={instruction.avisCrbRequis}
                                            onChange={(avisCrbRequis) =>
                                                onUpdateInstruction(
                                                    instruction.id,
                                                    {
                                                        avisCrbRequis,
                                                    }
                                                )
                                            }
                                        />
                                        {instruction.avisCrbRequis && (
                                            <Select<AvisCRB>
                                                label="Avis CRB"
                                                options={AVIS_CRB_OPTIONS}
                                                value={instruction.avisCRB}
                                                // The document is what the
                                                // screen reads from, so the
                                                // write is followed by a read
                                                // rather than by a copy held
                                                // here: the phase Grist
                                                // recomputes comes back with
                                                // it.
                                                onChange={(avisCRB) =>
                                                    onUpdateInstruction(
                                                        instruction.id,
                                                        {
                                                            avisCRB,
                                                        }
                                                    )
                                                }
                                            />
                                        )}
                                        <Select<AvisPrefet>
                                            label="Avis Préfet"
                                            options={AVIS_PREFET_OPTIONS}
                                            value={instruction.avisPrefet}
                                            onChange={(avisPrefet) =>
                                                onUpdateInstruction(
                                                    instruction.id,
                                                    {
                                                        avisPrefet,
                                                    }
                                                )
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
