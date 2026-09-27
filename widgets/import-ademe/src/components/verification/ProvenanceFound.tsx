import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { ProvenanceRepartition } from '@shared/infrastructure/import-bcib-bciat/transform-provenance/transform-provenance'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

function provenanceLabel({
    source,
    provenance,
}: ProvenanceRepartition): string {
    return source === 'Pays étranger' ? provenance : `Département ${provenance}`
}

export type ProvenanceFoundProps = {
    line: ExtractedLine
}

export default function ProvenanceFound({ line }: ProvenanceFoundProps) {
    const totalPercentage = line.derived.parsedProvenance.distribution.reduce(
        (total, share) => total + share.percentage,
        0
    )

    return (
        <div className="provenance-found">
            {line.derived.parsedProvenance.distribution.length === 0 ? (
                <p className="fr-text--sm fr-m-0 review__label">
                    Aucune provenance reconnue.
                </p>
            ) : (
                <table className="fr-text--sm fr-m-0 provenance-found__table">
                    <thead>
                        <tr>
                            <th scope="col">Provenance</th>
                            <th scope="col">Répartition (%)</th>
                            <th scope="col">Tonnage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {line.derived.parsedProvenance.distribution.map(
                            (share) => (
                                <tr key={`${share.source}-${share.provenance}`}>
                                    <td>{provenanceLabel(share)}</td>
                                    <td>{NUMBER.format(share.percentage)} %</td>
                                    <td>
                                        {NUMBER.format(
                                            (line.read.tonnage *
                                                share.percentage) /
                                                100
                                        )}{' '}
                                        t
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope="row">Total</th>
                            <td>{NUMBER.format(totalPercentage)} %</td>
                            <td>
                                {NUMBER.format(
                                    (line.read.tonnage * totalPercentage) / 100
                                )}{' '}
                                t
                            </td>
                        </tr>
                    </tfoot>
                </table>
            )}

            {line.derived.parsedProvenance.unrecognized.length > 0 && (
                <p className="fr-text--sm fr-m-0">
                    <span className="review__label">Non reconnu : </span>
                    {line.derived.parsedProvenance.unrecognized.join(', ')}
                </p>
            )}
        </div>
    )
}
