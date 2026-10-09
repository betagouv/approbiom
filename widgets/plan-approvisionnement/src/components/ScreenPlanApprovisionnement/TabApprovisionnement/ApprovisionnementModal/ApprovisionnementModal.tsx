import './ApprovisionnementModal.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useId, useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Modal from '@shared/react/components/Modal'
import Select, { type SelectItem } from '@shared/react/components/Select'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
} from '@shared/core/domain/value-objects/provenance'
import type { Referentiels } from '../../../../referentiels'
import {
    parseTonnage,
    toEditableFields,
    type ApprovisionnementForm,
    type EditableFields,
} from '../../../../approvisionnement-form'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import FournisseurField from '../../../FournisseurField'
import NewPaysForm from '../../../NewPaysForm'

export type ApprovisionnementModalProps = Referentiels & {
    pays: readonly Pays[]
    title: string
    submitLabel: string
    initial: ApprovisionnementForm
    failureMessage: string
    onSubmit: (fields: EditableFields) => Promise<void>
    onClose: () => void
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    onCreatePays: (pays: Pays) => Promise<void>
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
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
}: ApprovisionnementModalProps) {
    const tonnageId = useId()
    const [form, setForm] = useState(initial)
    const [tonnageTouched, setTonnageTouched] = useState(false)
    const [paysForm, setPaysForm] = useState<'closed' | 'open' | 'created'>(
        'closed'
    )
    const [saving, setSaving] = useState(false)
    const [failed, setFailed] = useState(false)

    const set = (changes: Partial<ApprovisionnementForm>) =>
        setForm((previous) => ({ ...previous, ...changes }))

    const choosePays = ({ libelle }: Pays) =>
        set({ provenance: `${PAYS_ETRANGER}|${libelle}` })

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

                <div>
                    <FournisseurField
                        entreprises={entreprises}
                        value={form.fournisseur}
                        onChange={(entreprise) =>
                            set({ fournisseur: entreprise?.siret })
                        }
                        onCreate={onCreateEntreprise}
                        findEntrepriseBySiret={findEntrepriseBySiret}
                    />
                </div>
                <Select
                    label="Ressource"
                    description="Obligatoire"
                    placeholder="Choisir une ressource"
                    options={ressourceOptions}
                    value={form.ressource}
                    onChange={(ressource) => set({ ressource })}
                />
                <div className="approvisionnement-modal__row">
                    <div>
                        <Select
                            label="Provenance"
                            description="Obligatoire"
                            placeholder="Choisir une provenance"
                            options={provenanceOptions}
                            value={form.provenance}
                            onChange={(provenance) => {
                                set({ provenance })
                                setPaysForm('closed')
                            }}
                        />
                        {paysForm === 'open' ? (
                            <NewPaysForm
                                pays={pays}
                                onCreate={async (created) => {
                                    await onCreatePays(created)
                                    choosePays(created)
                                    setPaysForm('created')
                                }}
                                onSelectExisting={(existing) => {
                                    choosePays(existing)
                                    setPaysForm('closed')
                                }}
                                onCancel={() => setPaysForm('closed')}
                            />
                        ) : paysForm === 'created' ? (
                            <p className="fr-valid-text fr-mt-1v">
                                Pays créé et sélectionné.
                            </p>
                        ) : (
                            <button
                                type="button"
                                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-add-line"
                                onClick={() => setPaysForm('open')}
                            >
                                {'Pays absent de la liste\u00a0? Créer un pays'}
                            </button>
                        )}
                    </div>
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
