import { useId } from 'react'
import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'
import ProvenanceFound from './ProvenanceFound'

export type FoundDataProps = {
    line: ImportedLines
}

export default function FoundData({ line }: FoundDataProps) {
    const titleId = useId()

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
                    <dd className="fr-text--sm fr-m-0">Aucun</dd>
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
