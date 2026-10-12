import { useRef, useState } from 'react'
import Combobox, {
    type ComboboxHandle,
    type ComboboxMessage,
} from '@shared/react/components/Combobox'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import { digitsOf, formatSiret } from '@shared/core/domain/value-objects/siret'
import { isNumericQuery } from './siret'
import { FOURNISSEUR_NOT_GIVEN } from '../../constant'
import NewFournisseurPanel from './NewFournisseurPanel'

export type FournisseurFieldProps = {
    entreprises: readonly Entreprise[]
    value: Entreprise['siret'] | undefined
    onChange: (entreprise: Entreprise | undefined) => void
    onCreate: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    documentSupplier?: string
    message?: ComboboxMessage
}

export default function FournisseurField({
    entreprises: allEntreprises,
    value,
    onChange,
    onCreate,
    findEntrepriseBySiret,
    documentSupplier = '',
    message,
}: FournisseurFieldProps) {
    const comboboxRef = useRef<ComboboxHandle>(null)
    const [creating, setCreating] = useState<{
        siret: string
        annuaireQuery: string
    } | null>(null)
    const [created, setCreated] = useState<Entreprise | null>(null)
    const [cleared, setCleared] = useState(false)

    // Rows of the Entreprise table without a name cannot be told apart, and
    // may share a SIRET with a named one.
    const entreprises = allEntreprises.filter(({ denomination }) =>
        denomination.trim()
    )

    const options: { value: Entreprise['siret'] | undefined; label: string }[] =
        [
            { value: undefined, label: FOURNISSEUR_NOT_GIVEN },
            ...[...entreprises]
                .sort((a, b) =>
                    a.denomination.localeCompare(b.denomination, 'fr')
                )
                .map((entreprise) => ({
                    value: entreprise.siret,
                    label: `${entreprise.denomination} — ${entreprise.siret}`,
                })),
        ]

    const isKnownSiret = (query: string) =>
        isNumericQuery(query) &&
        entreprises.some(({ siret }) => siret === digitsOf(query))

    function closePanel() {
        setCreating(null)
        requestAnimationFrame(() => comboboxRef.current?.focus())
    }

    function choose(entreprise: Entreprise | undefined) {
        setCreated(null)
        setCleared(false)
        onChange(entreprise)
    }

    function leaveEmpty() {
        setCleared(false)
        if (value !== undefined) choose(undefined)
    }

    const shownMessage: ComboboxMessage | undefined =
        created && created.siret === value
            ? {
                  severity: 'valid',
                  text: `Fournisseur « ${created.denomination} » ajouté et sélectionné.`,
              }
            : message

    return (
        <>
            <div
                onBlur={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget))
                        return
                    if (
                        cleared &&
                        event.target instanceof HTMLInputElement &&
                        event.target.value.trim() === ''
                    )
                        leaveEmpty()
                }}
            >
                <Combobox
                    ref={comboboxRef}
                    label="Fournisseur"
                    hint="Recherchez par dénomination ou par SIRET. S'il n'existe pas, vous pouvez l'ajouter."
                    options={options}
                    value={cleared ? null : value}
                    onChange={(siret) => {
                        if (siret === null) {
                            setCleared(true)
                            return
                        }

                        choose(
                            entreprises.find(
                                (entreprise) => entreprise.siret === siret
                            )
                        )
                    }}
                    action={{
                        label: (query) =>
                            isNumericQuery(query)
                                ? `Ajouter le fournisseur avec le SIRET ${formatSiret(digitsOf(query).slice(0, 14))}`
                                : 'Ajouter un nouveau fournisseur',
                        hidden: isKnownSiret,
                        onActivate: (query) =>
                            setCreating(
                                isNumericQuery(query)
                                    ? {
                                          siret: digitsOf(query).slice(0, 14),
                                          annuaireQuery: documentSupplier,
                                      }
                                    : {
                                          siret: '',
                                          annuaireQuery:
                                              query || documentSupplier,
                                      }
                            ),
                    }}
                    message={shownMessage}
                />
            </div>
            {creating && (
                <NewFournisseurPanel
                    initialSiret={creating.siret}
                    annuaireQuery={creating.annuaireQuery}
                    entreprises={entreprises}
                    findEntrepriseBySiret={findEntrepriseBySiret}
                    onCreate={async (entreprise) => {
                        await onCreate(entreprise)
                        choose(entreprise)
                        setCreated(entreprise)
                        closePanel()
                    }}
                    onSelectExisting={(entreprise) => {
                        choose(entreprise)
                        closePanel()
                    }}
                    onClose={closePanel}
                />
            )}
        </>
    )
}
