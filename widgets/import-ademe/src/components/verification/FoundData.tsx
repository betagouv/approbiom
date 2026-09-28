import { useId, useState } from 'react'
import Select, { type SelectProps } from '@shared/react/components/Select'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import ProvenanceFound from './ProvenanceFound'

export type FoundDataProps = {
    line: ExtractedLine
    entreprises: readonly Entreprise[]
}

function fournisseurHint(
    matchedSiret: Entreprise['siret'] | undefined,
    selectedSiret: Entreprise['siret'] | null
): Pick<SelectProps<Entreprise['siret']>, 'description' | 'message'> {
    if (selectedSiret === null)
        return {
            message: {
                severity: 'error',
                text: 'Aucune correspondance trouvée',
            },
        }

    return {
        description:
            selectedSiret === matchedSiret
                ? 'Correspondance trouvée'
                : 'Modifié',
    }
}

export default function FoundData({ line, entreprises }: FoundDataProps) {
    const titleId = useId()
    const { matchedFournisseur, matchedRessource } = line.derived
    const [fournisseurSiret, setFournisseurSiret] = useState<
        Entreprise['siret'] | null
    >(matchedFournisseur?.siret ?? null)

    const fournisseurOptions = entreprises.map(({ denomination, siret }) => ({
        value: siret,
        label: `${denomination} — ${siret}`,
    }))

    return (
        <section className="review__section" aria-labelledby={titleId}>
            <h3 id={titleId} className="fr-text--xs fr-m-0 review__title">
                Données trouvées
            </h3>
            <div className="found-data__field">
                <Select
                    label="Fournisseur"
                    placeholder="Choisir une entreprise"
                    options={fournisseurOptions}
                    value={fournisseurSiret}
                    onChange={setFournisseurSiret}
                    {...fournisseurHint(
                        matchedFournisseur?.siret,
                        fournisseurSiret
                    )}
                />
            </div>
            <dl className="review__list">
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Ressource trouvée
                    </dt>
                    <dd className="fr-text--sm fr-m-0">
                        {matchedRessource
                            ? `${matchedRessource.code} · ${matchedRessource.description}`
                            : 'Aucune'}
                    </dd>
                </div>
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Répartition trouvée
                    </dt>
                    <dd className="fr-m-0">
                        <ProvenanceFound line={line} />
                    </dd>
                </div>
            </dl>
        </section>
    )
}
