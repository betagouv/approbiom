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
    // Undefined for a fournisseur not given.
    value: Entreprise['siret'] | undefined
    onChange: (entreprise: Entreprise | undefined) => void
    onCreate: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    // The fournisseur as the document writes it, to look for on the
    // Annuaire des Entreprises. Empty for an approvisionnement typed in.
    documentSupplier?: string
    // From whoever saves the choice.
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
    // What the « Nouveau fournisseur » panel starts from, while it is open.
    const [creating, setCreating] = useState<{
        siret: string
        annuaireQuery: string
    } | null>(null)
    const [created, setCreated] = useState<Entreprise | null>(null)

    // The SIRET is part of the label, so a number typed finds it too.
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

    // The panel takes the focus; the field gets it back once it closes.
    function closePanel() {
        setCreating(null)
        requestAnimationFrame(() => comboboxRef.current?.focus())
    }

    function choose(entreprise: Entreprise | undefined) {
        setCreated(null)
        onChange(entreprise)
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
            <Combobox
                ref={comboboxRef}
                label="Fournisseur"
                hint="Recherchez par dénomination ou par SIRET. S'il n'existe pas, vous pouvez l'ajouter."
                options={options}
                value={value}
                onChange={(siret) => {
                    if (siret === null) return

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
                                      annuaireQuery: query || documentSupplier,
                                  }
                        ),
                }}
                message={shownMessage}
            />
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
