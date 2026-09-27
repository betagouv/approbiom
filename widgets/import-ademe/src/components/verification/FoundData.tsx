import { useId } from 'react'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import ProvenanceFound from './ProvenanceFound'

export type FoundDataProps = {
    line: ExtractedLine
}

export default function FoundData({ line }: FoundDataProps) {
    const titleId = useId()
    const { matchedFournisseur } = line.derived

    return (
        <section className="review__section" aria-labelledby={titleId}>
            <h3 id={titleId} className="fr-text--xs fr-m-0 review__title">
                Données trouvées
            </h3>
            <dl className="review__list">
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Fournisseur trouvé
                    </dt>
                    <dd className="fr-text--sm fr-m-0">
                        {matchedFournisseur
                            ? `${matchedFournisseur.denomination} — ${matchedFournisseur.siret}`
                            : 'Aucun'}
                    </dd>
                </div>
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Ressource trouvée
                    </dt>
                    <dd className="fr-text--sm fr-m-0">Aucune</dd>
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
