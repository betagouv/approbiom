import { useId } from 'react'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import DistributionList from './DistributionList'

export type ImportedDataProps = {
    line: ExtractedLine
    departementLabels: ReadonlyMap<string, string>
}

export default function ImportedData({
    line,
    departementLabels,
}: ImportedDataProps) {
    const titleId = useId()
    const { matchedFournisseur, matchedRessource } = line.derived

    return (
        <section className="review__section" aria-labelledby={titleId}>
            <h3 id={titleId} className="fr-h6 fr-m-0">
                Données retenues
            </h3>
            <dl className="review__list">
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Fournisseur
                    </dt>
                    <dd className="fr-text--sm fr-m-0">
                        {matchedFournisseur
                            ? `${matchedFournisseur.denomination} — ${matchedFournisseur.siret}`
                            : '—'}
                    </dd>
                </div>
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Ressource
                    </dt>
                    <dd className="fr-text--sm fr-m-0">
                        {matchedRessource
                            ? `${matchedRessource.code} · ${matchedRessource.description}`
                            : '—'}
                    </dd>
                </div>
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Répartition par provenance
                    </dt>
                    <dd className="fr-text--sm fr-m-0">
                        <DistributionList
                            line={line}
                            departementLabels={departementLabels}
                        />
                    </dd>
                </div>
            </dl>
        </section>
    )
}
