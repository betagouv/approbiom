import './TabApprovisionnement.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Badge from '@shared/react/components/Badge'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    toApprovisionnementRows,
    type ApprovisionnementRow,
    type Referentiels,
} from '../../../approvisionnement-rows'
import { FOURNISSEUR_NOT_GIVEN } from '../../../constant'
import EmptyPlan from '../EmptyPlan'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const plural = (count: number, word: string) =>
    `${count} ${word}${count > 1 ? 's' : ''}`

const COLUMNS: readonly Column<ApprovisionnementRow>[] = [
    {
        id: 'controle',
        header: 'Contrôle',
        render: ({ duplicate }) =>
            duplicate ? (
                <Badge size="sm" status="error">
                    Doublon {duplicate}
                </Badge>
            ) : (
                <Badge size="sm" status="success">
                    Pas de doublon
                </Badge>
            ),
    },
    {
        id: 'fournisseur',
        header: 'Fournisseur',
        render: ({ fournisseur }) =>
            fournisseur ?? (
                <span className="tab-approvisionnement__mention">
                    {FOURNISSEUR_NOT_GIVEN}
                </span>
            ),
    },
    { id: 'ressource', header: 'Ressource', render: (row) => row.ressource },
    { id: 'provenance', header: 'Provenance', render: (row) => row.provenance },
    {
        id: 'tonnage',
        header: (
            <span className="tab-approvisionnement__number">
                Tonnage (t MV/an)
            </span>
        ),
        render: ({ tonnage }) => (
            <span className="tab-approvisionnement__number">
                {NUMBER.format(tonnage)}
            </span>
        ),
    },
]

export type TabApprovisionnementProps = Referentiels & {
    // Those of the plan only.
    approvisionnements: readonly Approvisionnement[]
    hasAttachments: boolean
}

export default function TabApprovisionnement({
    approvisionnements,
    hasAttachments,
    ...referentiels
}: TabApprovisionnementProps) {
    const [duplicatesOnly, setDuplicatesOnly] = useState(false)

    const rows = toApprovisionnementRows(approvisionnements, referentiels)
    const duplicateCount = new Set(
        rows.flatMap(({ duplicate }) => (duplicate ? [duplicate] : []))
    ).size
    // Once the duplicates are fixed, there is nothing left to filter on.
    const filtered = duplicatesOnly && duplicateCount > 0
    const shownRows = filtered
        ? rows.filter(({ duplicate }) => duplicate !== null)
        : rows

    if (rows.length === 0) return <EmptyPlan hasAttachments={hasAttachments} />

    return (
        <div className="tab-approvisionnement">
            {duplicateCount > 0 && (
                <div className="tab-approvisionnement__duplicates">
                    <p className="fr-text--sm fr-m-0 tab-approvisionnement__duplicates-title">
                        <span
                            className="fr-icon-error-fill fr-icon--sm"
                            aria-hidden="true"
                        />
                        {plural(duplicateCount, 'doublon')} à corriger
                    </p>
                    <p className="fr-text--sm fr-m-0">
                        Deux lignes ou plus ont le même fournisseur, la même
                        ressource et la même provenance (badges de même lettre).
                        Un plan ne doit pas contenir deux fois le même
                        approvisionnement : modifiez ou supprimez les lignes en
                        trop.
                    </p>
                    <div>
                        <button
                            type="button"
                            className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-filter-line"
                            aria-pressed={filtered}
                            onClick={() => setDuplicatesOnly(!filtered)}
                        >
                            {filtered
                                ? 'Afficher toutes les lignes'
                                : 'Afficher uniquement les doublons'}
                        </button>
                    </div>
                </div>
            )}

            <DataTable
                caption="Approvisionnements du plan"
                hideCaption
                bordered
                rows={shownRows}
                columns={COLUMNS}
            />
        </div>
    )
}
