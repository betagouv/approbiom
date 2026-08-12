import './Chronologie.css'
import TagAvis from './TagAvis'
import {
    getEtapes,
    type EtapeId,
    type EtapeState,
} from '@shared/application/domain/chronologie-instruction'
import type { Instruction } from '@shared/application/domain/instruction'

const DATE = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
})

// What each step is called. Wording is read, not reasoned about, so it lives
// here rather than with the rules that order the steps.
const LABELS: Record<EtapeId, string> = {
    'saisine-crb': 'Saisine de la CRB',
    'avis-crb': 'Avis CRB remis au préfet',
    'avis-prefet': 'Avis du préfet rendu',
}

// What is written where the date goes when the step has none. A step that is
// behind us and dateless is a hole in the data, not a step still to come, so
// the two do not read the same.
const SANS_DATE: Record<EtapeState, string> = {
    done: 'Date non renseignée',
    current: 'Date non renseignée',
    pending: 'En attente',
    skipped: 'Non requis',
}

export type ChronologieProps = {
    instruction: Instruction
}

export default function Chronologie({ instruction }: ChronologieProps) {
    const etapes = getEtapes(instruction)

    return (
        <ol className="chronologie">
            {etapes.map((etape) => (
                <li
                    key={etape.id}
                    className={`chronologie__etape chronologie__etape--${etape.state}`}
                    aria-current={
                        etape.state === 'current' ? 'step' : undefined
                    }
                >
                    <p className="chronologie__date">
                        {etape.date === null
                            ? SANS_DATE[etape.state]
                            : DATE.format(etape.date)}
                    </p>

                    {/* The dot and the line into it: drawn, so nothing to read. */}
                    <div className="chronologie__jalon" aria-hidden="true">
                        <span className="chronologie__marqueur" />
                    </div>

                    <p className="chronologie__label">{LABELS[etape.id]}</p>

                    <div className="chronologie__avis">
                        {etape.avis !== null && <TagAvis avis={etape.avis} />}
                    </div>
                </li>
            ))}
        </ol>
    )
}
