import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { Instruction } from '@shared/core/domain/entities/instruction'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

type Props = {
    demandesSubvention: readonly {
        id: DemandeSubvention['id']
        programmeAide: Pick<ProgrammeAide, 'shortName' | 'laureat'>
        instructions: readonly Pick<
            Instruction,
            'avisCRB' | 'avisCrbRequis' | 'avisPrefet' | 'phase'
        >[]
    }[]
}

const TabUpdate = ({ demandesSubvention }: Props) => {
    return (
        <div>
            {demandesSubvention.length === 0 && (
                <p>
                    Aucune demande de subvention n&apos;a été renseignée pour ce
                    plan.
                </p>
            )}
            {demandesSubvention.map((demande) => (
                <div key={demande.id}>
                    <div>
                        <div>
                            Programme d&apos;aide&nbsp;:&nbsp;
                            {demande.programmeAide.shortName}{' '}
                        </div>
                        <div>
                            Lauréat&nbsp;:&nbsp;
                            {demande.programmeAide.laureat ??
                                'Aucun lauréat'}{' '}
                        </div>
                    </div>
                    <div>
                        {demande.instructions.length === 0 && (
                            <p>
                                Aucune instruction n&apos;a été renseignée pour
                                cette demande de subvention.
                            </p>
                        )}
                        {demande.instructions.map((instruction, key) => (
                            <div key={key}>
                                <div>
                                    {instruction.avisCrbRequis === true && (
                                        <div>
                                            Phase de
                                            l&apos;instruction&nbsp;:&nbsp;
                                            {instruction.avisCRB}{' '}
                                        </div>
                                    )}
                                    <div>
                                        Avis CRB&nbsp;:&nbsp;
                                        {instruction.avisCRB}{' '}
                                    </div>
                                    <div>
                                        Avis Préfet&nbsp;:&nbsp;
                                        {instruction.avisPrefet}{' '}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default TabUpdate
