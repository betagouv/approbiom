// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/tableau
// A complex table (merged cells): every cell names its headers through
// `headers`/`id`, and a summary describes how it reads.
import '@gouvfr/dsfr/dist/component/table/table.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.main.min.css'
import './ConcurrenceTable.css'
import TagStatut from '@shared/react/ui/components/TagStatut'
import { getRessourceIcon } from '@shared/react/ui/ressource-icon'
import { formatNumber } from '@shared/react/format'
import {
    type CSSProperties,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import type {
    PlanConcurrent,
    RessourceConcurrente,
} from '../build-plans-concurrents'

type Props = {
    plansConcurrents: readonly PlanConcurrent[]
}

const COLUMN_COUNT = 4

/** Names the toggle of a plan Grist gives no name for. */
const PLAN_SANS_NOM = 'Plan sans nom'

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
            {/* Hidden: its name would come before the ressource in the row
                header read out for every cell. */}
            <span
                className={`${iconClassName} fr-icon--sm`}
                style={style}
                aria-hidden="true"
                title={familleLabel === '' ? undefined : familleLabel}
            />
            <span>
                {ressource.nom}
                {familleLabel !== '' && (
                    <span className="fr-sr-only">
                        {' '}
                        (famille : {familleLabel})
                    </span>
                )}
            </span>
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

    // WCAG 2.4.11: the stuck header wraps when the column narrows, so the room
    // a focused toggle keeps below it follows its actual height.
    const theadRef = useRef<HTMLTableSectionElement>(null)
    const [headerHeight, setHeaderHeight] = useState<number | null>(null)
    useLayoutEffect(() => {
        const thead = theadRef.current
        if (thead === null || typeof ResizeObserver === 'undefined') return

        const observer = new ResizeObserver(() =>
            setHeaderHeight(thead.getBoundingClientRect().height)
        )
        observer.observe(thead)
        return () => observer.disconnect()
    }, [])

    const count = plansConcurrents.length

    return (
        <div
            className="fr-table fr-table--bordered fr-table--multiline concurrence-table"
            style={
                headerHeight === null
                    ? undefined
                    : ({
                          '--concurrence-table-header-height': `${headerHeight}px`,
                      } as CSSProperties)
            }
        >
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
                Le nom de chaque plan est un bouton qui replie ou déplie ses
                ressources.
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
                            <thead ref={theadRef}>
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
                            {plansConcurrents.map(({ plan, ressources }) => {
                                const planHeaderId = `${id}-plan-${plan.id}`
                                const rowId = (index: number) =>
                                    `${planHeaderId}-row-${index}`
                                const isCollapsed = collapsedPlans.has(plan.id)
                                const controlledRows = ressources
                                    .map((_, index) => rowId(index))
                                    .join(' ')

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
                                                        aria-controls={
                                                            controlledRows ||
                                                            undefined
                                                        }
                                                        onClick={() =>
                                                            togglePlan(plan.id)
                                                        }
                                                    >
                                                        <span
                                                            className="fr-icon-arrow-down-s-line concurrence-table__chevron"
                                                            aria-hidden="true"
                                                        />
                                                        {plan.nom ||
                                                            PLAN_SANS_NOM}
                                                    </button>
                                                    {plan.statut !== '' && (
                                                        <TagStatut
                                                            statut={plan.statut}
                                                        />
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
                                                        <span aria-hidden="true">
                                                            /
                                                        </span>
                                                        <span className="fr-sr-only">
                                                            sur
                                                        </span>{' '}
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
