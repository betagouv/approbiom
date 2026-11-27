// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/tableau
// A complex table (merged cells): every cell names its headers through
// `headers`/`id`, and a summary describes how it reads.
import '@gouvfr/dsfr/dist/component/table/table.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.main.min.css'
import './ConcurrenceTable.css'
import Badge from '@shared/react/ui/components/Badge'
import { getRessourceIcon } from '@shared/react/ui/ressource-icon'
import { formatNumber } from '@shared/react/format'
import { PLAN_STATUT_PROJECT } from '@shared/core/domain/value-objects/plan-statut'
import { useId, useState } from 'react'
import type {
    PlanConcurrent,
    RessourceConcurrente,
} from '../build-plans-concurrents'

type Props = {
    plansConcurrents: readonly PlanConcurrent[]
}

const COLUMN_COUNT = 4

function RetenusLines({
    retenus,
    nonRetenus,
}: {
    retenus: readonly string[]
    nonRetenus: readonly string[]
}) {
    return (
        <>
            {retenus.length > 0 && (
                <p className="concurrence-table__line">
                    <span className="concurrence-table__mention">
                        Retenus :{' '}
                    </span>
                    {retenus.join(', ')}
                </p>
            )}
            {nonRetenus.length > 0 && (
                <p className="concurrence-table__line">
                    <span className="concurrence-table__mention">
                        Non retenus :{' '}
                    </span>
                    {nonRetenus.join(', ')}
                </p>
            )}
        </>
    )
}

function RessourceName({ ressource }: { ressource: RessourceConcurrente }) {
    const { iconClassName, colorToken, familleLabel } = getRessourceIcon(
        ressource.code,
        ressource.famille
    )
    const style = { color: `var(${colorToken})` }

    return (
        <span className="concurrence-table__ressource">
            {familleLabel === '' ? (
                <span
                    className={`${iconClassName} fr-icon--sm`}
                    style={style}
                    aria-hidden="true"
                />
            ) : (
                <span
                    className={`${iconClassName} fr-icon--sm`}
                    style={style}
                    role="img"
                    aria-label={`Famille : ${familleLabel}`}
                    title={`Famille : ${familleLabel}`}
                />
            )}
            {ressource.nom}
        </span>
    )
}

export default function ConcurrenceTable({ plansConcurrents }: Props) {
    const id = useId()
    const titleId = `${id}-title`
    const countId = `${id}-count`
    const summaryId = `${id}-summary`
    const columnIds = {
        ressource: `${id}-col-ressource`,
        provenances: `${id}-col-provenances`,
        fournisseurs: `${id}-col-fournisseurs`,
        tonnage: `${id}-col-tonnage`,
    }

    const [collapsedPlans, setCollapsedPlans] = useState<ReadonlySet<number>>(
        new Set()
    )

    function togglePlan(planId: number) {
        setCollapsedPlans((current) => {
            const next = new Set(current)
            if (!next.delete(planId)) next.add(planId)
            return next
        })
    }

    const count = plansConcurrents.length

    return (
        <div className="fr-table fr-table--bordered fr-table--multiline concurrence-table">
            {/* Outside `fr-table__wrapper`, the scrolling box, so the title does
                not scroll away with the rows. */}
            <div className="concurrence-table__header">
                <h2 id={titleId} className="concurrence-table__title">
                    Plans d&apos;approvisionnement concernés
                </h2>
                <p
                    id={countId}
                    className="concurrence-table__count"
                    aria-live="polite"
                >
                    {count === 0
                        ? 'Aucun plan ne correspond aux filtres'
                        : count === 1
                          ? '1 plan correspond aux filtres'
                          : `${count} plans correspondent aux filtres`}
                </p>
            </div>
            <p id={summaryId} className="fr-sr-only">
                Le tableau regroupe les ressources par plan
                d&apos;approvisionnement. Chaque plan est une ligne
                d&apos;en-tête, suivie d&apos;une ligne par ressource. Pour
                chaque ressource, les provenances et les fournisseurs sont «
                retenus » s&apos;ils correspondent aux filtres Provenance et
                Fournisseur, « non retenus » sinon. Le tonnage donne le tonnage
                retenu sur le tonnage total, en tonne de matière verte par an.
            </p>
            <div className="fr-table__wrapper">
                {/* Focusable so keyboard users can scroll the rows between two
                    plan toggles. */}
                <div
                    className="fr-table__container concurrence-table__scroller"
                    tabIndex={0}
                    role="region"
                    aria-labelledby={titleId}
                >
                    <div className="fr-table__content">
                        <table
                            aria-labelledby={`${titleId} ${countId}`}
                            aria-describedby={summaryId}
                        >
                            <thead>
                                <tr>
                                    <th id={columnIds.ressource}>Ressource</th>
                                    <th id={columnIds.provenances}>
                                        Provenances
                                    </th>
                                    <th id={columnIds.fournisseurs}>
                                        Fournisseurs
                                    </th>
                                    <th id={columnIds.tonnage}>
                                        Tonnage{' '}
                                        <span className="concurrence-table__unit">
                                            (en tonne de matière verte par an)
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            {count === 0 && (
                                <tbody>
                                    <tr>
                                        <td colSpan={COLUMN_COUNT}>
                                            Aucun plan ne correspond aux
                                            filtres.
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                            {plansConcurrents.map(({ plan, ressources }) => {
                                const planHeaderId = `${id}-plan-${plan.id}`
                                const rowId = (index: number) =>
                                    `${planHeaderId}-row-${index}`
                                const isCollapsed = collapsedPlans.has(plan.id)

                                return (
                                    <tbody key={plan.id}>
                                        <tr className="concurrence-table__plan">
                                            <th
                                                id={planHeaderId}
                                                colSpan={COLUMN_COUNT}
                                            >
                                                <div className="concurrence-table__plan-header">
                                                    <button
                                                        type="button"
                                                        className="concurrence-table__toggle"
                                                        aria-expanded={
                                                            !isCollapsed
                                                        }
                                                        aria-controls={ressources
                                                            .map((_, index) =>
                                                                rowId(index)
                                                            )
                                                            .join(' ')}
                                                        onClick={() =>
                                                            togglePlan(plan.id)
                                                        }
                                                    >
                                                        <span
                                                            className="fr-icon-arrow-down-s-line concurrence-table__chevron"
                                                            aria-hidden="true"
                                                        />
                                                        {plan.nom}
                                                    </button>
                                                    {plan.statut !== '' && (
                                                        <Badge
                                                            size="sm"
                                                            color={
                                                                plan.statut ===
                                                                PLAN_STATUT_PROJECT
                                                                    ? 'pink-macaron'
                                                                    : undefined
                                                            }
                                                        >
                                                            {plan.statut}
                                                        </Badge>
                                                    )}
                                                    {plan.departementDeSituation !==
                                                        '' && (
                                                        <span className="concurrence-table__departement">
                                                            <span
                                                                className="fr-icon-map-pin-2-line fr-icon--sm"
                                                                aria-hidden="true"
                                                            />
                                                            {
                                                                plan.departementDeSituation
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                        {ressources.map((ressource, index) => {
                                            const ressourceHeaderId = `${planHeaderId}-ressource-${index}`
                                            const cellHeaders = (
                                                columnId: string
                                            ) =>
                                                `${columnId} ${planHeaderId} ${ressourceHeaderId}`

                                            return (
                                                <tr
                                                    key={index}
                                                    id={rowId(index)}
                                                    hidden={isCollapsed}
                                                    className="concurrence-table__row"
                                                >
                                                    <th
                                                        id={ressourceHeaderId}
                                                        headers={`${columnIds.ressource} ${planHeaderId}`}
                                                    >
                                                        <RessourceName
                                                            ressource={
                                                                ressource
                                                            }
                                                        />
                                                    </th>
                                                    <td
                                                        headers={cellHeaders(
                                                            columnIds.provenances
                                                        )}
                                                    >
                                                        <RetenusLines
                                                            retenus={
                                                                ressource
                                                                    .provenances
                                                                    .retenues
                                                            }
                                                            nonRetenus={
                                                                ressource
                                                                    .provenances
                                                                    .nonRetenues
                                                            }
                                                        />
                                                    </td>
                                                    <td
                                                        headers={cellHeaders(
                                                            columnIds.fournisseurs
                                                        )}
                                                    >
                                                        <RetenusLines
                                                            retenus={
                                                                ressource
                                                                    .fournisseurs
                                                                    .retenus
                                                            }
                                                            nonRetenus={
                                                                ressource
                                                                    .fournisseurs
                                                                    .nonRetenus
                                                            }
                                                        />
                                                    </td>
                                                    <td
                                                        headers={cellHeaders(
                                                            columnIds.tonnage
                                                        )}
                                                    >
                                                        {formatNumber(
                                                            ressource.tonnageRetenu
                                                        )}{' '}
                                                        <span className="concurrence-table__mention">
                                                            retenus
                                                        </span>{' '}
                                                        /{' '}
                                                        {formatNumber(
                                                            ressource.tonnageTotal
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                )
                            })}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
