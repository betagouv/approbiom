import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import { useState, type SubmitEvent } from 'react'
import { isNombreUtilisateurs } from '../options'

type ConfigurationProps = {
    nombreUtilisateurs: number | null
    onSave: (nombreUtilisateurs: number) => Promise<void>
    onCancel: () => void
}

export default function Configuration({
    nombreUtilisateurs,
    onSave,
    onCancel,
}: ConfigurationProps) {
    const [saisie, setSaisie] = useState(nombreUtilisateurs?.toString() ?? '')
    // Kept apart: a number that Grist could not take is no fault of the field,
    // which must not turn red for it.
    const [erreurSaisie, setErreurSaisie] = useState('')
    const [echec, setEchec] = useState('')
    const [enCours, setEnCours] = useState(false)

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault()
        setEchec('')

        // `Number('')` is 0, which the check below refuses like any other
        // number of users that is not a whole one above 0.
        const nombre = Number(saisie.trim())
        if (!isNombreUtilisateurs(nombre)) {
            setErreurSaisie('Saisissez un nombre entier supérieur à 0.')
            return
        }

        setEnCours(true)
        try {
            await onSave(nombre)
        } catch (cause) {
            setEchec(
                `La configuration n’a pas pu être appliquée : ${cause instanceof Error ? cause.message : String(cause)}`
            )
            setEnCours(false)
        }
    }

    return (
        // `noValidate`: the browser's own bubble would answer before the DSFR
        // error message below ever shows.
        <form noValidate onSubmit={(event) => void handleSubmit(event)}>
            <h2 className="fr-h5">Configuration du widget</h2>
            <div
                className={`fr-input-group${erreurSaisie ? ' fr-input-group--error' : ''}`}
            >
                <label className="fr-label" htmlFor="nombre-utilisateurs">
                    Nombre total d’utilisateurs
                    <span className="fr-hint-text">
                        Sert à calculer la part des utilisateurs qui ont créé un
                        plan. Après « Appliquer », cliquez sur « Enregistrer »
                        en haut du widget pour le conserver.
                    </span>
                </label>
                <input
                    className={`fr-input${erreurSaisie ? ' fr-input--error' : ''}`}
                    id="nombre-utilisateurs"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    // The form only opens when asked for, from Grist's creator
                    // panel: the field is where the user is headed.
                    autoFocus
                    value={saisie}
                    onChange={(event) => {
                        setSaisie(event.target.value)
                        setErreurSaisie('')
                    }}
                    // The messages block rather than the hint, which the label
                    // already reads out as part of the field's name.
                    aria-describedby="nombre-utilisateurs-messages"
                    aria-invalid={erreurSaisie ? true : undefined}
                    required
                />
                {/* Rendered even with nothing to say: `aria-live` only
                    announces changes to a region already on the page. */}
                <div
                    className="fr-messages-group"
                    id="nombre-utilisateurs-messages"
                    aria-live="polite"
                >
                    {erreurSaisie && (
                        <p className="fr-message fr-message--error">
                            {erreurSaisie}
                        </p>
                    )}
                </div>
            </div>
            {echec && (
                <p className="fr-message fr-message--error" role="alert">
                    {echec}
                </p>
            )}
            <ul className="fr-btns-group fr-btns-group--inline-sm">
                <li>
                    <button className="fr-btn" type="submit" disabled={enCours}>
                        Appliquer
                    </button>
                </li>
                <li>
                    <button
                        className="fr-btn fr-btn--secondary"
                        type="button"
                        onClick={onCancel}
                    >
                        Annuler
                    </button>
                </li>
            </ul>
        </form>
    )
}
