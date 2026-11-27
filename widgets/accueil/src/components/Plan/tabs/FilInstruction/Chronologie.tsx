import './Chronologie.css'
import BadgeAvis from '../../../BadgeAvis'
import {
    getEtapes,
    type EtapeId,
    type EtapeState,
    type Instruction,
} from '@shared/core/domain/entities/instruction'

const DATE = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
})

const LABELS: Record<EtapeId, string> = {
    'saisine-crb': 'Saisine de la CRB',
    'avis-crb': 'Avis CRB remis au préfet',
    'avis-prefet': 'Avis du préfet rendu',
}

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

                    <div className="chronologie__jalon" aria-hidden="true">
                        <span className="chronologie__marqueur" />
                    </div>

                    <p className="chronologie__label">{LABELS[etape.id]}</p>

                    <div className="chronologie__avis">
                        {etape.avis !== null && <BadgeAvis avis={etape.avis} />}
                    </div>
                </li>
            ))}
        </ol>
    )
}
