import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Pays } from '@shared/core/domain/value-objects/pays'

const FRANCE = 'France'

type Errors = { libelle?: string; existing?: Pays; creation?: string }

// Two spellings of one country differ only by case or accents.
const normalized = (libelle: string) =>
    libelle
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase()

export type NewPaysFormProps = {
    pays: readonly Pays[]
    onCreate: (pays: Pays) => Promise<void>
    onSelectExisting: (pays: Pays) => void
    onCancel: () => void
}

export default function NewPaysForm({
    pays,
    onCreate,
    onSelectExisting,
    onCancel,
}: NewPaysFormProps) {
    const id = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [libelle, setLibelle] = useState('')
    const [errors, setErrors] = useState<Errors>({})
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    function validate(): Errors {
        if (libelle.trim() === '') return { libelle: 'Saisissez le pays.' }
        if (normalized(libelle) === normalized(FRANCE))
            return {
                libelle:
                    'La France se choisit par département, dans la liste des provenances.',
            }

        const existing = pays.find(
            (candidate) => normalized(candidate.libelle) === normalized(libelle)
        )

        return existing
            ? {
                  libelle: `Ce pays existe déjà : ${existing.libelle}.`,
                  existing,
              }
            : {}
    }

    async function submit(event: FormEvent) {
        event.preventDefault()

        const found = validate()
        setErrors(found)
        if (found.libelle) return

        setCreating(true)
        try {
            await onCreate({ libelle: libelle.trim() })
        } catch {
            setErrors({ creation: "Le pays n'a pas pu être créé. Réessayez." })
            setCreating(false)
        }
    }

    const inputId = `${id}-libelle`
    const errorId = `${inputId}-error`

    return (
        <form
            className="new-pays"
            onSubmit={(event) => void submit(event)}
            noValidate
        >
            <div
                className={`fr-input-group${errors.libelle ? ' fr-input-group--error' : ''}`}
            >
                <label className="fr-label" htmlFor={inputId}>
                    Nouveau pays
                </label>
                <div className="new-pays__line">
                    <input
                        ref={inputRef}
                        id={inputId}
                        className={`fr-input${errors.libelle ? ' fr-input--error' : ''}`}
                        value={libelle}
                        onChange={(event) => {
                            setLibelle(event.target.value)
                            setErrors({})
                        }}
                        aria-describedby={errors.libelle ? errorId : undefined}
                    />
                    <button
                        type="submit"
                        className="fr-btn fr-btn--sm"
                        disabled={creating}
                    >
                        Créer le pays
                    </button>
                    <button
                        type="button"
                        className="fr-btn fr-btn--secondary fr-btn--sm"
                        onClick={onCancel}
                    >
                        Annuler
                    </button>
                </div>
                {errors.libelle && (
                    <p id={errorId} className="fr-error-text">
                        {errors.libelle}
                    </p>
                )}
                {errors.existing && (
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm fr-mt-1w"
                        onClick={() =>
                            errors.existing && onSelectExisting(errors.existing)
                        }
                    >
                        Choisir ce pays
                    </button>
                )}
                {errors.creation && (
                    <p className="fr-error-text" role="alert">
                        {errors.creation}
                    </p>
                )}
            </div>
        </form>
    )
}
