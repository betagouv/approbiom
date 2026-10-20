import '@gouvfr/dsfr/dist/component/tile/tile.main.min.css'

type IndicateurProps = {
    titre: string
    valeur: string
    detail: string
    /** A second, quieter line under the detail. */
    note?: string
    /** Draws the figure as a share, from 0 to 1, under it. */
    barre?: number
}

/** One key figure, in a DSFR tile with no link: it is read, not clicked. */
export default function Indicateur({
    titre,
    valeur,
    detail,
    note,
    barre,
}: IndicateurProps) {
    return (
        <div className="fr-tile fr-tile--no-icon indicateur">
            <div className="fr-tile__body">
                <div className="fr-tile__content">
                    <h2 className="fr-tile__title">{titre}</h2>
                    <p className="fr-tile__desc indicateur__valeur">{valeur}</p>
                    {barre !== undefined && (
                        // The figure above already says it in words: the bar
                        // is only there to be seen.
                        <div className="indicateur__barre" aria-hidden="true">
                            <div
                                className="indicateur__barre-valeur"
                                style={{ width: `${barre * 100}%` }}
                            />
                        </div>
                    )}
                    <p className="fr-tile__detail">{detail}</p>
                    {note && (
                        <p className="fr-tile__detail indicateur__note">
                            {note}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
