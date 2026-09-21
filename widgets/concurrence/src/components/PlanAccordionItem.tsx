import '@gouvfr/dsfr/dist/component/accordion/accordion.main.min.css'
import '@gouvfr/dsfr/dist/component/tag/tag.main.min.css'
import './PlanAccordionItem.css'
import { useId } from 'react'
import type { ConcurrenceRow, PlanConcurrence } from '../load-concurrence'

export type PlanAccordionItemProps = {
    nom: PlanConcurrence['nom']
    departementDeSituation: PlanConcurrence['departementDeSituation']
    ressource: ConcurrenceRow['ressource']
    tonnageTotal: ConcurrenceRow['tonnageTotal']
    provenances: readonly string[]
    tonnageRetenu: number
    provenancesRetenues: readonly string[]
    fournisseursRetenus: readonly string[]
    isExpanded: boolean
    onToggle: () => void
}

const formatTonnage = (tonnage: number) => tonnage.toLocaleString('fr-FR')

export default function PlanAccordionItem({
    nom,
    departementDeSituation,
    ressource,
    tonnageTotal,
    provenances,
    tonnageRetenu,
    provenancesRetenues,
    fournisseursRetenus,
    isExpanded,
    onToggle,
}: PlanAccordionItemProps) {
    const detailsId = useId()

    return (
        <li className="fr-accordion plan-accordion-item">
            <h3 className="fr-accordion__title">
                <button
                    type="button"
                    className="fr-accordion__btn"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={onToggle}
                >
                    <span className="plan-accordion-item__summary">
                        <span className="plan-accordion-item__nom">{nom}</span>
                        <span className="plan-accordion-item__tonnage">
                            <span className="fr-sr-only">
                                Tonnage retenu :{' '}
                            </span>
                            {formatTonnage(tonnageRetenu)} t/an
                        </span>
                        <span className="plan-accordion-item__provenances">
                            {departementDeSituation && (
                                <span>{departementDeSituation}</span>
                            )}
                            <span className="fr-sr-only">
                                Provenances retenues :
                            </span>
                            {/* Spans rather than the shared Tag: its `<p>`
                                cannot sit inside a button. */}
                            {provenancesRetenues.map((provenance) => (
                                <span
                                    key={provenance}
                                    className="fr-tag fr-tag--sm"
                                >
                                    {provenance}
                                </span>
                            ))}
                        </span>
                    </span>
                </button>
            </h3>
            <div
                id={detailsId}
                className={`fr-collapse ${isExpanded ? 'fr-collapse--expanded' : ''}`}
            >
                <dl className="fr-raw-list plan-accordion-item__details">
                    <div>
                        <dt>
                            Tonnage total (en tonne de matière verte par an)
                        </dt>
                        <dd>{formatTonnage(tonnageTotal)}</dd>
                    </div>
                    <div>
                        <dt>Provenances</dt>
                        <dd>{provenances.join(', ')}</dd>
                    </div>
                    <div>
                        <dt>Ressource</dt>
                        <dd>{ressource}</dd>
                    </div>
                    <div>
                        <dt>Fournisseurs retenus</dt>
                        <dd>{fournisseursRetenus.join(', ') || 'Inconnu'}</dd>
                    </div>
                </dl>
            </div>
        </li>
    )
}
