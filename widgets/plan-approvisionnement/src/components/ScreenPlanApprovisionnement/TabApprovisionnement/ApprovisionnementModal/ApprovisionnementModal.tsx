import './ApprovisionnementModal.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useId, useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Combobox from '@shared/react/components/Combobox'
import Modal from '@shared/react/components/Modal'
import Select, { type SelectItem } from '@shared/react/components/Select'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import type { Referentiels } from '../../../../approvisionnement-rows'
import {
    NO_FOURNISSEUR,
    parseTonnage,
    toEditableFields,
    type ApprovisionnementForm,
    type EditableFields,
} from '../../../../approvisionnement-form'
import { FOURNISSEUR_NOT_GIVEN } from '../../../../constant'

export type ApprovisionnementModalProps = Referentiels & {
    pays: readonly Pays[]
    title: string
    submitLabel: string
    initial: ApprovisionnementForm
    // Shown at the top of the modal when `onSubmit` fails.
    failureMessage: string
    onSubmit: (fields: EditableFields) => Promise<void>
    onClose: () => void
}

export default function ApprovisionnementModal({
    entreprises,
    ressources,
    departementsByRegion,
    pays,
    title,
    submitLabel,
    initial,
    failureMessage,
    onSubmit,
    onClose,
}: ApprovisionnementModalProps) {
    const tonnageId = useId()
    const [form, setForm] = useState(initial)
    const [tonnageTouched, setTonnageTouched] = useState(false)
    const [saving, setSaving] = useState(false)
    const [failed, setFailed] = useState(false)

    const set = (changes: Partial<ApprovisionnementForm>) =>
        setForm((previous) => ({ ...previous, ...changes }))

    // A value the referentiels lack is still offered, so that it shows.
    const fournisseurOptions = [
        { value: NO_FOURNISSEUR, label: FOURNISSEUR_NOT_GIVEN },
        ...entreprises.map(({ siret, denomination }) => ({
            value: siret,
            label: `${denomination} — ${siret}`,
        })),
        ...(initial.fournisseur &&
        !entreprises.some(({ siret }) => siret === initial.fournisseur)
            ? [{ value: initial.fournisseur, label: initial.fournisseur }]
            : []),
    ]
    const ressourceOptions = ressources.map(({ code, title }) => ({
        value: code,
        label: `${code} · ${title}`,
    }))
    const provenanceOptions: SelectItem<string>[] = [
        ...departementsByRegion.map(({ region, departements }) => ({
            id: region.reg,
            label: region.libelle,
            options: departements.map(({ dep, libelle }) => ({
                value: `${DEPARTEMENT_FRANCAIS}|${dep}`,
                label: `${libelle} (${dep})`,
            })),
        })),
        {
            id: 'pays',
            label: 'Pays étrangers',
            options: pays.map(({ libelle }) => ({
                value: `${PAYS_ETRANGER}|${libelle}`,
                label: libelle,
            })),
        },
    ]

    const fields = toEditableFields(form)
    const tonnageInvalid =
        (tonnageTouched || form.tonnage.trim() !== '') &&
        parseTonnage(form.tonnage) === null
    const missing = [
        form.fournisseur === null && 'le fournisseur (ou « Non renseigné »)',
        form.ressource === null && 'la ressource',
        form.provenance === null && 'la provenance',
        parseTonnage(form.tonnage) === null && 'un tonnage supérieur à 0',
    ].filter(Boolean)

    async function submit() {
        if (!fields) return

        setSaving(true)
        setFailed(false)
        try {
            await onSubmit(fields)
        } catch {
            setFailed(true)
            setSaving(false)
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={title}
            size="lg"
            actions={
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-icon-check-line"
                            disabled={!fields || saving}
                            onClick={() => void submit()}
                        >
                            {submitLabel}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="fr-btn fr-btn--secondary"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </li>
                </ul>
            }
        >
            <div className="approvisionnement-modal">
                {failed && (
                    <Alert severity="error" size="sm">
                        {failureMessage}
                    </Alert>
                )}

                <Combobox
                    label="Fournisseur"
                    hint="Dénomination ou SIRET"
                    options={fournisseurOptions}
                    value={form.fournisseur}
                    onChange={(fournisseur) => set({ fournisseur })}
                />
                <Select
                    label="Ressource"
                    description="Obligatoire"
                    placeholder="Choisir une ressource"
                    options={ressourceOptions}
                    value={form.ressource}
                    onChange={(ressource) => set({ ressource })}
                />
                <div className="approvisionnement-modal__row">
                    <Select
                        label="Provenance"
                        description="Obligatoire"
                        placeholder="Choisir une provenance"
                        options={provenanceOptions}
                        value={form.provenance}
                        onChange={(provenance) => set({ provenance })}
                    />
                    <div
                        className={`fr-input-group${tonnageInvalid ? ' fr-input-group--error' : ''}`}
                    >
                        <label className="fr-label" htmlFor={tonnageId}>
                            Tonnage (t MV/an)
                            <span className="fr-hint-text">Obligatoire</span>
                        </label>
                        <input
                            id={tonnageId}
                            className={`fr-input approvisionnement-modal__number${tonnageInvalid ? ' fr-input--error' : ''}`}
                            inputMode="decimal"
                            value={form.tonnage}
                            aria-describedby={
                                tonnageInvalid
                                    ? `${tonnageId}-message`
                                    : undefined
                            }
                            onChange={(event) =>
                                set({ tonnage: event.target.value })
                            }
                            onBlur={() => setTonnageTouched(true)}
                        />
                        {tonnageInvalid && (
                            <div
                                className="fr-messages-group"
                                id={`${tonnageId}-message`}
                            >
                                <p className="fr-message fr-message--error">
                                    Saisissez un tonnage supérieur à 0.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {missing.length > 0 && (
                    <p className="fr-text--sm fr-m-0 approvisionnement-modal__mention">
                        Pour enregistrer, renseignez {missing.join(', ')}.
                    </p>
                )}
            </div>
        </Modal>
    )
}
