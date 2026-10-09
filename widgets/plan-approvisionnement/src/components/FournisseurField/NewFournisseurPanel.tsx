import './NewFournisseurPanel.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import { useEffect, useId, useRef, useState } from 'react'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { annuaireSearchUrl } from '@shared/infrastructure/referentiel-entreprise/annuaire-entreprises'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import { digitsOf } from '@shared/core/domain/value-objects/siret'
import { checkSiret } from './siret'

type LookupResult = SiretLookup | { status: 'error' }

export type NewFournisseurPanelProps = {
    initialSiret: string
    annuaireQuery: string
    entreprises: readonly Entreprise[]
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    onCreate: (entreprise: Entreprise) => Promise<void>
    onSelectExisting: (entreprise: Entreprise) => void
    onClose: () => void
}

export default function NewFournisseurPanel({
    initialSiret,
    annuaireQuery,
    entreprises,
    findEntrepriseBySiret,
    onCreate,
    onSelectExisting,
    onClose,
}: NewFournisseurPanelProps) {
    const id = useId()
    const ids = {
        legend: `${id}-legend`,
        siret: `${id}-siret`,
        count: `${id}-siret-count`,
        siretMessages: `${id}-siret-messages`,
        denomination: `${id}-denomination`,
        denominationMessages: `${id}-denomination-messages`,
    }

    const siretRef = useRef<HTMLInputElement>(null)
    const [siret, setSiret] = useState(initialSiret)
    const [touched, setTouched] = useState(false)
    const [addTried, setAddTried] = useState(false)
    const [creationFailed, setCreationFailed] = useState(false)
    // One answer per SIRET: an answer for a SIRET since changed stays here,
    // unused, rather than showing against the new one.
    const [results, setResults] = useState<Record<string, LookupResult>>({})
    const requested = useRef(new Set<string>())

    const check = checkSiret(siret, entreprises)
    const current = check.ok ? check.siret : null
    const result = current === null ? undefined : results[current]
    const status = current === null ? 'idle' : (result?.status ?? 'loading')

    useEffect(() => {
        siretRef.current?.focus()
    }, [])

    useEffect(() => {
        if (current === null || requested.current.has(current)) return

        requested.current.add(current)
        findEntrepriseBySiret(current).then(
            (found) =>
                setResults((previous) => ({ ...previous, [current]: found })),
            () =>
                setResults((previous) => ({
                    ...previous,
                    [current]: { status: 'error' },
                }))
        )
    }, [current, results, findEntrepriseBySiret])

    function retry() {
        if (current === null) return

        requested.current.delete(current)
        setResults((previous) => {
            const others = { ...previous }
            delete others[current]
            return others
        })
    }

    async function add() {
        if (!check.ok) {
            setTouched(true)
            siretRef.current?.focus()
            return
        }
        if (result?.status !== 'found') {
            setAddTried(true)
            return
        }

        setCreationFailed(false)
        try {
            await onCreate({
                siret: check.siret,
                denomination: result.denomination,
            })
        } catch {
            setCreationFailed(true)
        }
    }

    const siretError =
        !check.ok && (check.immediate || touched) ? check.error : null
    const duplicate = check.ok ? undefined : check.duplicate

    const denominationMessage =
        status === 'loading'
            ? addTried
                ? {
                      severity: 'error',
                      text: 'La dénomination doit être trouvée pour ajouter le fournisseur.',
                  }
                : {
                      severity: 'info',
                      text: 'Recherche de la dénomination en cours…',
                  }
            : status === 'found'
              ? { severity: 'valid', text: 'Établissement trouvé.' }
              : status === 'notfound'
                ? {
                      severity: 'error',
                      text: 'Aucun établissement actif trouvé pour ce SIRET. Vérifiez le numéro.',
                  }
                : status === 'error'
                  ? {
                        severity: 'error',
                        text: 'Le service de recherche est momentanément indisponible.',
                    }
                  : null
    const denominationInError =
        status === 'notfound' ||
        status === 'error' ||
        denominationMessage?.severity === 'error'

    const siretState = siretError
        ? 'error'
        : status === 'found'
          ? 'valid'
          : null

    return (
        <fieldset
            className="new-fournisseur"
            aria-labelledby={ids.legend}
            onKeyDown={(event) => {
                if (event.key !== 'Escape') return

                event.preventDefault()
                event.stopPropagation()
                onClose()
            }}
        >
            <legend id={ids.legend} className="fr-h6 new-fournisseur__legend">
                Nouveau fournisseur
            </legend>

            <div
                className={`fr-input-group${siretState ? ` fr-input-group--${siretState}` : ''}`}
            >
                <label className="fr-label" htmlFor={ids.siret}>
                    SIRET
                    <span className="fr-hint-text">
                        14 chiffres, figurant sur le Kbis ou l&apos;avis de
                        situation Insee. Exemple : 123 456 789 00012
                    </span>
                </label>
                <p className="fr-text--sm new-fournisseur__help">
                    Vous ne le connaissez pas ?{' '}
                    <a
                        className="fr-link"
                        href={annuaireSearchUrl(annuaireQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Chercher « ${annuaireQuery} » sur l'Annuaire des Entreprises - nouvelle fenêtre`}
                    >
                        Chercher sur l&apos;Annuaire des Entreprises
                    </a>
                </p>
                <input
                    ref={siretRef}
                    id={ids.siret}
                    className={`fr-input${siretState ? ` fr-input--${siretState}` : ''}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={17}
                    aria-invalid={siretError !== null}
                    aria-describedby={`${ids.count} ${ids.siretMessages}`}
                    value={siret}
                    onChange={(event) => {
                        setSiret(event.target.value)
                        setAddTried(false)
                        setCreationFailed(false)
                    }}
                    onBlur={() => {
                        if (digitsOf(siret)) setTouched(true)
                    }}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') return

                        event.preventDefault()
                        void add()
                    }}
                />
                {/* Outside the live region: it would be read at every key. */}
                <p
                    id={ids.count}
                    className="fr-text--xs new-fournisseur__count"
                >
                    {digitsOf(siret).replace(/\D/g, '').length} / 14 chiffres
                </p>
                <div
                    className="fr-messages-group"
                    id={ids.siretMessages}
                    aria-live="polite"
                >
                    {siretError && (
                        <p className="fr-message fr-message--error">
                            {siretError}
                        </p>
                    )}
                </div>
                {duplicate && (
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-arrow-right-line new-fournisseur__shortcut"
                        onClick={() => onSelectExisting(duplicate)}
                    >
                        Sélectionner « {duplicate.denomination} »
                    </button>
                )}
            </div>

            <div
                className={`fr-input-group${denominationInError ? ' fr-input-group--error' : status === 'found' ? ' fr-input-group--valid' : ''}`}
            >
                <label className="fr-label" htmlFor={ids.denomination}>
                    Dénomination
                    <span className="fr-hint-text">
                        Renseignée automatiquement à partir du SIRET (annuaire
                        des entreprises).
                    </span>
                </label>
                <input
                    id={ids.denomination}
                    className="fr-input new-fournisseur__denomination"
                    type="text"
                    readOnly
                    aria-readonly="true"
                    aria-describedby={ids.denominationMessages}
                    value={
                        result?.status === 'found' ? result.denomination : ''
                    }
                    placeholder={
                        status === 'loading' ? 'Recherche…' : undefined
                    }
                />
                <div
                    className="fr-messages-group"
                    id={ids.denominationMessages}
                    aria-live="polite"
                >
                    {denominationMessage && (
                        <p
                            className={`fr-message fr-message--${denominationMessage.severity}`}
                        >
                            {denominationMessage.text}
                        </p>
                    )}
                </div>
                {status === 'error' && (
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-refresh-line new-fournisseur__shortcut"
                        onClick={retry}
                    >
                        Réessayer
                    </button>
                )}
            </div>

            {creationFailed && (
                <p className="fr-message fr-message--error" role="alert">
                    Le fournisseur n&apos;a pas pu être ajouté. Réessayez.
                </p>
            )}

            <ul className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--sm new-fournisseur__actions">
                <li>
                    <button
                        type="button"
                        className="fr-btn"
                        onClick={() => void add()}
                    >
                        Ajouter le fournisseur
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        className="fr-btn fr-btn--tertiary"
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                </li>
            </ul>
        </fieldset>
    )
}
