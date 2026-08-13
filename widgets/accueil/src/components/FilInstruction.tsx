import './FilInstruction.css'
import Chronologie from './Chronologie'
import type { DemandeSubventionAccueil } from '@shared/application/read-models/plan-accueil'

export type FilInstructionProps = {
    demandes: readonly DemandeSubventionAccueil[]
}

export default function FilInstruction({ demandes }: FilInstructionProps) {
    if (demandes.length === 0) {
        return (
            <p className="fr-text--sm">
                Aucune demande de subvention n’est rattachée à ce dossier.
            </p>
        )
    }

    return (
        <div className="fil-instruction">
            {demandes.map(({ id, programmeAide, instructions }) => (
                <section key={id} className="fil-instruction__programme">
                    <h2 className="fr-h5 fil-instruction__titre">
                        Chronologie de l’instruction - {programmeAide.shortName}
                    </h2>

                    {instructions.length === 0 ? (
                        <p className="fr-text--sm">
                            Aucun CRB n’a encore été saisie pour ce programme.
                        </p>
                    ) : (
                        instructions.map((instruction) => (
                            <div
                                key={`${instruction.subvention}-${instruction.crb}`}
                                className="fil-instruction__instruction"
                            >
                                <h3 className="fr-h6 fil-instruction__crb">
                                    {instruction.crb}
                                </h3>

                                <Chronologie instruction={instruction} />
                            </div>
                        ))
                    )}
                </section>
            ))}
        </div>
    )
}
