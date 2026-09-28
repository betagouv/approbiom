import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'

type Errors = {
    denomination?: string
    siret?: string
    existing?: Entreprise
    creation?: string
}

export type NewFournisseurFormProps = {
    defaultDenomination: string
    entreprises: readonly Entreprise[]
    onCreate: (entreprise: Entreprise) => Promise<void>
    onSelectExisting: (entreprise: Entreprise) => void
    onCancel: () => void
}

export default function NewFournisseurForm({
    defaultDenomination,
    entreprises,
    onCreate,
    onSelectExisting,
    onCancel,
}: NewFournisseurFormProps) {
    const id = useId()
    const denominationRef = useRef<HTMLInputElement>(null)
    const [denomination, setDenomination] = useState(defaultDenomination)
    const [siret, setSiret] = useState('')
    const [errors, setErrors] = useState<Errors>({})
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        denominationRef.current?.focus()
    }, [])

    function validate(): Errors {
        const digits = siret.replace(/\s/g, '')
        const existing = entreprises.find(
            (entreprise) => entreprise.siret === digits
        )

        return {
            ...(denomination.trim() === '' && {
                denomination: 'Saisissez la dénomination.',
            }),
            ...(!/^\d{14}$/.test(digits)
                ? { siret: 'Le SIRET doit comporter 14 chiffres.' }
                : existing && {
                      siret: `Ce SIRET existe déjà : ${existing.denomination}.`,
                      existing,
                  }),
        }
    }

    async function submit(event: FormEvent) {
        event.preventDefault()

        const found = validate()
        setErrors(found)
        if (found.denomination || found.siret) return

        setCreating(true)
        try {
            await onCreate({
                denomination: denomination.trim(),
                siret: siret.replace(/\s/g, ''),
            })
        } catch {
            setErrors({
                creation: "Le fournisseur n'a pas pu être créé. Réessayez.",
            })
            setCreating(false)
        }
    }

    const denominationId = `${id}-denomination`
    const siretId = `${id}-siret`

    return (
        <form
            className="new-fournisseur"
            onSubmit={(event) => void submit(event)}
            noValidate
        >
            <fieldset className="fr-fieldset fr-mb-0 new-fournisseur__fieldset">
                <legend className="fr-fieldset__legend fr-text--regular fr-text--sm fr-p-0 fr-mb-1v">
                    Nouveau fournisseur
                </legend>
                <div className="new-fournisseur__fields">
                    <div
                        className={`fr-input-group${errors.denomination ? ' fr-input-group--error' : ''}`}
                    >
                        <label className="fr-label" htmlFor={denominationId}>
                            Dénomination
                        </label>
                        <input
                            ref={denominationRef}
                            id={denominationId}
                            className={`fr-input${errors.denomination ? ' fr-input--error' : ''}`}
                            value={denomination}
                            onChange={(event) => {
                                setDenomination(event.target.value)
                                setErrors(({ siret, existing }) => ({
                                    siret,
                                    existing,
                                }))
                            }}
                            aria-describedby={
                                errors.denomination
                                    ? `${denominationId}-error`
                                    : undefined
                            }
                        />
                        {errors.denomination && (
                            <p
                                id={`${denominationId}-error`}
                                className="fr-error-text"
                            >
                                {errors.denomination}
                            </p>
                        )}
                    </div>
                    <div
                        className={`fr-input-group${errors.siret ? ' fr-input-group--error' : ''}`}
                    >
                        <label className="fr-label" htmlFor={siretId}>
                            SIRET
                            <span className="fr-hint-text">14 chiffres</span>
                        </label>
                        <input
                            id={siretId}
                            className={`fr-input${errors.siret ? ' fr-input--error' : ''}`}
                            inputMode="numeric"
                            autoComplete="off"
                            value={siret}
                            onChange={(event) => {
                                setSiret(event.target.value)
                                setErrors(({ denomination }) => ({
                                    denomination,
                                }))
                            }}
                            aria-describedby={
                                errors.siret ? `${siretId}-error` : undefined
                            }
                        />
                        {errors.siret && (
                            <p
                                id={`${siretId}-error`}
                                className="fr-error-text"
                            >
                                {errors.siret}
                            </p>
                        )}
                        {errors.existing && (
                            <button
                                type="button"
                                className="fr-btn fr-btn--tertiary fr-btn--sm fr-mt-1w"
                                onClick={() =>
                                    errors.existing &&
                                    onSelectExisting(errors.existing)
                                }
                            >
                                Choisir cette entreprise
                            </button>
                        )}
                    </div>
                </div>
                {errors.creation && (
                    <p className="fr-error-text" role="alert">
                        {errors.creation}
                    </p>
                )}
                <div className="new-fournisseur__actions">
                    <button
                        type="submit"
                        className="fr-btn fr-btn--sm"
                        disabled={creating}
                    >
                        Créer le fournisseur
                    </button>
                    <button
                        type="button"
                        className="fr-btn fr-btn--secondary fr-btn--sm"
                        onClick={onCancel}
                    >
                        Annuler
                    </button>
                </div>
            </fieldset>
        </form>
    )
}
