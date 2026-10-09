import './TabApprovisionnement.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-design/icons-design.main.min.css'

import { useState, type ReactNode } from 'react'
import Badge from '@shared/react/components/Badge'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import {
    toApprovisionnementRows,
    type ApprovisionnementRow,
} from '../../../approvisionnement-rows'
import type { Referentiels } from '../../../referentiels'
import {
    EMPTY_FORM,
    toForm,
    type EditableFields,
} from '../../../approvisionnement-form'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import { FOURNISSEUR_NOT_GIVEN } from '../../../constant'
import EmptyPlan from '../EmptyPlan'
import AddApprovisionnementModal from './AddApprovisionnementModal'
import ApprovisionnementModal from './ApprovisionnementModal'
import DeleteApprovisionnementModal from './DeleteApprovisionnementModal'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const plural = (count: number, word: string) =>
    `${count} ${word}${count > 1 ? 's' : ''}`

const DATA_COLUMNS: readonly Column<ApprovisionnementRow>[] = [
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

// What a screen reader hears after « Modifier » or « Supprimer »: the buttons
// of every row read the same otherwise.
const describe = ({
    fournisseur,
    ressource,
    provenance,
}: ApprovisionnementRow) =>
    ` l'approvisionnement ${fournisseur ?? FOURNISSEUR_NOT_GIVEN}, ${ressource}, ${provenance}`

export type TabApprovisionnementProps = Referentiels & {
    approvisionnements: readonly Approvisionnement[]
    pays: readonly Pays[]
    hasAttachments: boolean
    onCreate: (fields: EditableFields) => Promise<void>
    onUpdate: (
        id: Approvisionnement['id'],
        fields: EditableFields
    ) => Promise<void>
    onDelete: (id: Approvisionnement['id']) => Promise<void>
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    onCreatePays: (pays: Pays) => Promise<void>
    onImportFromDocument: () => void
    children?: ReactNode
}

export default function TabApprovisionnement({
    approvisionnements,
    pays,
    hasAttachments,
    onCreate,
    onUpdate,
    onDelete,
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
    onImportFromDocument,
    children,
    ...referentiels
}: TabApprovisionnementProps) {
    const [duplicatesOnly, setDuplicatesOnly] = useState(false)
    const [adding, setAdding] = useState<'choosing' | 'manual' | null>(null)
    const [editedId, setEditedId] = useState<Approvisionnement['id'] | null>(
        null
    )
    const [deletedId, setDeletedId] = useState<Approvisionnement['id'] | null>(
        null
    )

    const rows = toApprovisionnementRows(approvisionnements, referentiels)
    const duplicateCount = new Set(
        rows.flatMap(({ duplicate }) => (duplicate ? [duplicate] : []))
    ).size
    const filtered = duplicatesOnly && duplicateCount > 0
    const shownRows = filtered
        ? rows.filter(({ duplicate }) => duplicate !== null)
        : rows

    const edited = approvisionnements.find(({ id }) => id === editedId)
    const deleted = rows.find(({ id }) => id === deletedId)

    const columns: readonly Column<ApprovisionnementRow>[] = [
        ...DATA_COLUMNS,
        {
            id: 'actions',
            header: 'Actions',
            render: (row) => (
                <div className="tab-approvisionnement__actions">
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-edit-line"
                        onClick={() => setEditedId(row.id)}
                    >
                        Modifier
                        <span className="fr-sr-only">{describe(row)}</span>
                    </button>
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line"
                        onClick={() => setDeletedId(row.id)}
                    >
                        Supprimer
                        <span className="fr-sr-only">{describe(row)}</span>
                    </button>
                </div>
            ),
        },
    ]

    const formProps = {
        ...referentiels,
        pays,
        onCreateEntreprise,
        findEntrepriseBySiret,
        onCreatePays,
    }

    return (
        <div className="tab-approvisionnement">
            {children}
            <div className="tab-approvisionnement__toolbar">
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
                            ressource et la même provenance (badges de même
                            lettre). Un plan ne doit pas contenir deux fois le
                            même approvisionnement : modifiez ou supprimez les
                            lignes en trop.
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
                <button
                    type="button"
                    className="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-add-line tab-approvisionnement__add"
                    onClick={() => setAdding('choosing')}
                >
                    Ajouter des approvisionnements
                </button>
            </div>

            {rows.length === 0 ? (
                <EmptyPlan hasAttachments={hasAttachments} />
            ) : (
                <DataTable
                    caption="Approvisionnements du plan"
                    hideCaption
                    bordered
                    multiLine
                    rows={shownRows}
                    columns={columns}
                />
            )}

            {adding === 'choosing' && (
                <AddApprovisionnementModal
                    hasAttachments={hasAttachments}
                    onManual={() => setAdding('manual')}
                    onDocument={onImportFromDocument}
                    onClose={() => setAdding(null)}
                />
            )}
            {adding === 'manual' && (
                <ApprovisionnementModal
                    {...formProps}
                    title="Nouvel approvisionnement"
                    submitLabel="Créer l'approvisionnement"
                    initial={EMPTY_FORM}
                    failureMessage="La création a échoué. L'approvisionnement n'a pas été ajouté au plan. Réessayez."
                    onSubmit={async (fields) => {
                        await onCreate(fields)
                        setAdding(null)
                    }}
                    onClose={() => setAdding(null)}
                />
            )}

            {edited && (
                <ApprovisionnementModal
                    {...formProps}
                    title="Modifier l'approvisionnement"
                    submitLabel="Enregistrer"
                    initial={toForm(edited)}
                    failureMessage="L'enregistrement a échoué. Vos modifications n'ont pas été prises en compte. Réessayez."
                    onSubmit={async (fields) => {
                        await onUpdate(edited.id, fields)
                        setEditedId(null)
                    }}
                    onClose={() => setEditedId(null)}
                />
            )}
            {deleted && (
                <DeleteApprovisionnementModal
                    row={deleted}
                    onConfirm={async () => {
                        await onDelete(deleted.id)
                        setDeletedId(null)
                    }}
                    onClose={() => setDeletedId(null)}
                />
            )}
        </div>
    )
}
