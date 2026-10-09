import './TabSynthese.css'

import { useId, useState } from 'react'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import { toApprovisionnementRows } from '../../../approvisionnement-rows'
import type { Referentiels } from '../../../referentiels'
import { toSynthese, type Share } from './synthese'
import { FOURNISSEUR_NOT_GIVEN } from '../../../constant'
import EmptyPlan from '../EmptyPlan'
import RessourceFilter from './RessourceFilter'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const PERCENT = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1,
})

const tonnageOf = (tonnage: number) => `${NUMBER.format(tonnage)} t MV/an`

function ShareCard({
    title,
    shares,
    total,
}: {
    title: string
    shares: readonly Share[]
    total: number
}) {
    const titleId = useId()

    return (
        <section className="share-card" aria-labelledby={titleId}>
            <h3 id={titleId} className="fr-text--md fr-m-0 share-card__title">
                {title}
            </h3>
            <ul className="fr-text--sm fr-m-0 share-card__rows">
                {shares.map(({ label, tonnage, percentage }) => (
                    <li key={label ?? ''} className="share-card__row">
                        <span
                            className={
                                label === null
                                    ? 'share-card__label share-card__label--not-given'
                                    : 'share-card__label'
                            }
                        >
                            {label ?? FOURNISSEUR_NOT_GIVEN}
                        </span>
                        <span className="share-card__bar" aria-hidden="true">
                            <span
                                className="share-card__bar-value"
                                style={{ width: `${percentage}%` }}
                            />
                        </span>
                        <span className="share-card__number">
                            {tonnageOf(tonnage)}
                        </span>
                        <span className="share-card__number share-card__percentage">
                            {PERCENT.format(percentage / 100)}
                        </span>
                    </li>
                ))}
                <li className="share-card__row share-card__total">
                    <span className="share-card__label">Total</span>
                    <span />
                    <span className="share-card__number">
                        {tonnageOf(total)}
                    </span>
                    <span className="share-card__number share-card__percentage">
                        {PERCENT.format(1)}
                    </span>
                </li>
            </ul>
        </section>
    )
}

export type TabSyntheseProps = Referentiels & {
    approvisionnements: readonly Approvisionnement[]
    hasAttachments: boolean
}

export default function TabSynthese({
    approvisionnements,
    hasAttachments,
    ...referentiels
}: TabSyntheseProps) {
    const [chosen, setChosen] = useState<readonly Ressource['code'][]>([])

    if (approvisionnements.length === 0)
        return <EmptyPlan hasAttachments={hasAttachments} />

    const titles = new Map(
        referentiels.ressources.map(({ code, title }) => [code, title])
    )
    const ressources = [...new Set(approvisionnements.map((a) => a.ressource))]
        .sort()
        .map((code) => ({ code, title: titles.get(code) ?? '' }))
    const filtered = chosen.length > 0
    const { total, byProvenance, byFournisseur } = toSynthese(
        toApprovisionnementRows(
            filtered
                ? approvisionnements.filter(({ ressource }) =>
                      chosen.includes(ressource)
                  )
                : approvisionnements,
            referentiels
        )
    )

    return (
        <div className="tab-synthese">
            <div className="tab-synthese__head">
                <h2 className="fr-text--md fr-m-0 tab-synthese__title">
                    Répartition du tonnage du plan
                </h2>
                {ressources.length > 1 && (
                    <RessourceFilter
                        ressources={ressources}
                        chosen={chosen}
                        onChange={setChosen}
                    />
                )}
            </div>

            <div className="tab-synthese__cards">
                <ShareCard
                    title="Par provenance"
                    shares={byProvenance}
                    total={total}
                />
                <ShareCard
                    title="Par fournisseur"
                    shares={byFournisseur}
                    total={total}
                />
            </div>
        </div>
    )
}
