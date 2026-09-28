import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useId, useRef, useState } from 'react'
import Select, { type SelectItem } from '@shared/react/components/Select'
import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { ProvenanceRepartition } from '@shared/infrastructure/import-bcib-bciat/transform-provenance/transform-provenance'
import NewPaysForm from './NewPaysForm'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

const DEPARTEMENT = 'Département français'
const PAYS = 'Pays étranger'

// A Select value has to be compared with ===, so a provenance is carried as
// one string: its source, then its département code or country name.
function keyOf({ source, provenance }: ProvenanceRepartition): string | null {
    return provenance === '' ? null : `${source}|${provenance}`
}

function fromKey(
    key: string
): Pick<ProvenanceRepartition, 'source' | 'provenance'> {
    const [source, provenance] = key.split('|')

    return {
        source: source === PAYS ? PAYS : DEPARTEMENT,
        provenance,
    }
}

const round = (value: number) => Math.round(value * 100) / 100

type Row = ProvenanceRepartition & { key: number }

// The field being typed in keeps its text as typed; the other one follows.
type Draft = { key: number; field: 'percentage' | 'tonnage'; text: string }

export type ProvenanceEditorProps = {
    distribution: readonly ProvenanceRepartition[]
    tonnage: number
    departementsByRegion: readonly DepartementsByRegion[]
    pays: readonly Pays[]
    onChange: (distribution: ProvenanceRepartition[]) => void
    onCreatePays: (pays: Pays) => Promise<void>
}

export default function ProvenanceEditor({
    distribution,
    tonnage,
    departementsByRegion,
    pays,
    onChange,
    onCreatePays,
}: ProvenanceEditorProps) {
    const id = useId()
    const [rows, setRows] = useState<Row[]>(() =>
        distribution.map((repartition, key) => ({ ...repartition, key }))
    )
    const [nextKey, setNextKey] = useState(distribution.length)
    const [draft, setDraft] = useState<Draft | null>(null)
    const [paysForm, setPaysForm] = useState<{
        key: number
        state: 'creating' | 'created'
    } | null>(null)
    const rowsRef = useRef<HTMLUListElement>(null)

    const options: SelectItem<string>[] = [
        ...departementsByRegion.map(({ region, departements }) => ({
            id: region.reg,
            label: region.libelle,
            options: departements.map(({ dep, libelle }) => ({
                value: `${DEPARTEMENT}|${dep}`,
                label: `${libelle} (${dep})`,
            })),
        })),
        {
            id: 'pays',
            label: 'Pays étrangers',
            options: pays.map(({ libelle }) => ({
                value: `${PAYS}|${libelle}`,
                label: libelle,
            })),
        },
    ]

    const tonnageOf = (percentage: number) => (tonnage * percentage) / 100
    const percentageOf = (rowTonnage: number) =>
        tonnage === 0 ? 0 : (rowTonnage / tonnage) * 100

    function commit(next: Row[]) {
        setRows(next)
        onChange(
            next.map(({ source, provenance, percentage }) => ({
                source,
                provenance,
                percentage,
            }))
        )
    }

    function update(key: number, changes: Partial<ProvenanceRepartition>) {
        return rows.map((row) =>
            row.key === key ? { ...row, ...changes } : row
        )
    }

    function type(row: Row, field: Draft['field'], text: string) {
        setDraft({ key: row.key, field, text })

        const value = Number(text.replace(',', '.'))
        if (text === '' || Number.isNaN(value)) return

        setRows(
            update(row.key, {
                percentage:
                    field === 'percentage' ? value : percentageOf(value),
            })
        )
    }

    function valueOf(row: Row, field: Draft['field']): string {
        if (draft?.key === row.key && draft.field === field) return draft.text

        return String(
            round(
                field === 'percentage'
                    ? row.percentage
                    : tonnageOf(row.percentage)
            )
        )
    }

    function leave() {
        setDraft(null)
        commit(rows)
    }

    // The form takes the place of the row's select: the focus goes back to
    // the select once it has closed.
    function closePaysForm(key: number, created: boolean) {
        setPaysForm(created ? { key, state: 'created' } : null)
        requestAnimationFrame(() =>
            rowsRef.current
                ?.querySelector<HTMLSelectElement>(`[data-row="${key}"] select`)
                ?.focus()
        )
    }

    function choosePays(row: Row, { libelle }: Pays) {
        commit(update(row.key, { source: PAYS, provenance: libelle }))
    }

    async function createPays(row: Row, pays: Pays) {
        await onCreatePays(pays)
        choosePays(row, pays)
        closePaysForm(row.key, true)
    }

    const totalPercentage = rows.reduce(
        (total, row) => total + row.percentage,
        0
    )

    return (
        <div className="provenance-editor">
            {rows.length === 0 ? (
                <p className="fr-text--sm fr-my-1w review__label">
                    Aucune provenance trouvée. Ajoutez-les à partir de la valeur
                    du document.
                </p>
            ) : (
                <ul
                    ref={rowsRef}
                    className="fr-raw-list provenance-editor__rows"
                >
                    {rows.map((row, index) => {
                        const percentageId = `${id}-${row.key}-percentage`
                        const tonnageId = `${id}-${row.key}-tonnage`

                        return (
                            <li
                                key={row.key}
                                data-row={row.key}
                                className="provenance-editor__row"
                            >
                                <Select
                                    label="Provenance"
                                    placeholder="Choisir"
                                    options={options}
                                    value={keyOf(row)}
                                    onChange={(key) => {
                                        setPaysForm(null)
                                        commit(update(row.key, fromKey(key)))
                                    }}
                                />
                                <div className="fr-input-group provenance-editor__number">
                                    <label
                                        className="fr-label"
                                        htmlFor={percentageId}
                                    >
                                        Répartition (%)
                                    </label>
                                    <input
                                        id={percentageId}
                                        className="fr-input"
                                        inputMode="decimal"
                                        value={valueOf(row, 'percentage')}
                                        onChange={(event) =>
                                            type(
                                                row,
                                                'percentage',
                                                event.target.value
                                            )
                                        }
                                        onBlur={leave}
                                    />
                                </div>
                                <div className="fr-input-group provenance-editor__number">
                                    <label
                                        className="fr-label"
                                        htmlFor={tonnageId}
                                    >
                                        Tonnage (en tonne MV/an)
                                    </label>
                                    <input
                                        id={tonnageId}
                                        className="fr-input"
                                        inputMode="decimal"
                                        value={valueOf(row, 'tonnage')}
                                        onChange={(event) =>
                                            type(
                                                row,
                                                'tonnage',
                                                event.target.value
                                            )
                                        }
                                        onBlur={leave}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-delete-line"
                                    title={`Supprimer la provenance ${index + 1}`}
                                    onClick={() =>
                                        commit(
                                            rows.filter(
                                                ({ key }) => key !== row.key
                                            )
                                        )
                                    }
                                >
                                    Supprimer la provenance {index + 1}
                                </button>
                                {paysForm?.key === row.key &&
                                paysForm.state === 'creating' ? (
                                    <div className="provenance-editor__extra">
                                        <NewPaysForm
                                            pays={pays}
                                            onCreate={(created) =>
                                                createPays(row, created)
                                            }
                                            onSelectExisting={(existing) => {
                                                choosePays(row, existing)
                                                closePaysForm(row.key, false)
                                            }}
                                            onCancel={() =>
                                                closePaysForm(row.key, false)
                                            }
                                        />
                                    </div>
                                ) : paysForm?.key === row.key ? (
                                    <p className="fr-valid-text fr-mt-0 provenance-editor__extra">
                                        Pays « {row.provenance} » créé
                                    </p>
                                ) : (
                                    row.provenance === '' && (
                                        <div className="provenance-editor__extra">
                                            <button
                                                type="button"
                                                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-add-line"
                                                onClick={() =>
                                                    setPaysForm({
                                                        key: row.key,
                                                        state: 'creating',
                                                    })
                                                }
                                            >
                                                Pays absent de la liste ? Créer
                                                un pays
                                            </button>
                                        </div>
                                    )
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}

            <div className="provenance-editor__foot">
                <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-add-line"
                    onClick={() => {
                        commit([
                            ...rows,
                            {
                                key: nextKey,
                                source: DEPARTEMENT,
                                provenance: '',
                                percentage: 0,
                            },
                        ])
                        setNextKey(nextKey + 1)
                    }}
                >
                    Ajouter une provenance
                </button>
                <p className="fr-text--sm fr-m-0 provenance-editor__total">
                    Total : {NUMBER.format(totalPercentage)} % ·{' '}
                    {NUMBER.format(tonnageOf(totalPercentage))} tonnes MV/an
                </p>
            </div>
        </div>
    )
}
