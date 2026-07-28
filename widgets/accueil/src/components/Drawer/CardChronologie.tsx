import '@gouvfr/dsfr/dist/component/badge/badge.main.min.css'
import './CardChronologie.css'
import { formatDate, getDerniereEtapeFaite } from '../../utils'

export type Etape = {
    label: string
    date: number | null
}

const A_VENIR = 'À venir'
const DATE_INDEFINIE = 'Date non renseignée'

export type CardChronologieProps = {
    etapes: readonly Etape[]
}

export default function CardChronologie({ etapes }: CardChronologieProps) {
    const derniereEtapeFaite = getDerniereEtapeFaite(
        etapes.map((etape) => etape.date)
    )

    return (
        <ol className="card-chronologie fr-raw-list">
            {etapes.map((etape, index) => {
                const estFaite = index <= derniereEtapeFaite

                return (
                    <li
                        key={etape.label}
                        className={
                            estFaite
                                ? 'card-chronologie__etape card-chronologie__etape--fait'
                                : 'card-chronologie__etape'
                        }
                    >
                        <span
                            className="card-chronologie__marqueur"
                            aria-hidden="true"
                        />
                        <span className="card-chronologie__label fr-text--sm">
                            {etape.label}
                        </span>
                        <span
                            className={
                                estFaite
                                    ? 'fr-badge fr-badge--sm fr-badge--success'
                                    : 'fr-badge fr-badge--sm'
                            }
                        >
                            {etape.date === null
                                ? estFaite
                                    ? DATE_INDEFINIE
                                    : A_VENIR
                                : formatDate(etape.date)}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}
