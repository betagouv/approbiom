import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

function provenanceLabel({
    source,
    provenance,
}: ImportedLines['provenance'][number]): string {
    return source === 'Pays étranger' ? provenance : `Département ${provenance}`
}

export type ProvenanceFoundProps = {
    line: ImportedLines
}

export default function ProvenanceFound({ line }: ProvenanceFoundProps) {
    const totalPercentage = line.provenance.reduce(
        (total, share) => total + share.percentage,
        0
    )

    return (
        <div className="provenance-found">
            {line.provenance.length === 0 ? (
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
                        {line.provenance.map((share) => (
                            <tr key={`${share.source}-${share.provenance}`}>
                                <td>{provenanceLabel(share)}</td>
                                <td>{NUMBER.format(share.percentage)} %</td>
                                <td>
                                    {NUMBER.format(
                                        (line.tonnage * share.percentage) / 100
                                    )}{' '}
                                    t
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope="row">Total</th>
                            <td>{NUMBER.format(totalPercentage)} %</td>
                            <td>
                                {NUMBER.format(
                                    (line.tonnage * totalPercentage) / 100
                                )}{' '}
                                t
                            </td>
                        </tr>
                    </tfoot>
                </table>
            )}

            {line.unrecognized.length > 0 && (
                <p className="fr-text--sm fr-m-0">
                    <span className="review__label">Non reconnu : </span>
                    {line.unrecognized.join(', ')}
                </p>
            )}
        </div>
    )
}
