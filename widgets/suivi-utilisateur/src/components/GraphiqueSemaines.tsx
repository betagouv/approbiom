import { formatNumber } from '@shared/react/format'
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { lundiCourt, lundiLong } from '../format-semaine'
import type { UtilisateursDeLaSemaine } from '../suivi-creations'

const TITRE = 'Utilisateurs ayant créé un plan, par semaine'

type GraphiqueSemainesProps = {
    semaines: readonly UtilisateursDeLaSemaine[]
}

/**
 * The bars are decorative: a visually hidden table gives screen readers the
 * figures.
 */
export default function GraphiqueSemaines({
    semaines,
}: GraphiqueSemainesProps) {
    const defilement = useRef<HTMLDivElement>(null)

    // When the weeks overflow, open scrolled to the latest ones.
    useLayoutEffect(() => {
        const element = defilement.current
        if (element) element.scrollLeft = element.scrollWidth
    }, [semaines])

    // At least 1, so that a run of empty weeks does not divide by zero.
    const max = Math.max(1, ...semaines.map(({ utilisateurs }) => utilisateurs))

    return (
        <div className="graphique">
            <h2 className="fr-h6 fr-mb-2w">{TITRE}</h2>
            {semaines.length === 0 ? (
                <p className="fr-text--sm fr-mb-0">
                    Aucun utilisateur n’a encore créé de plan.
                </p>
            ) : (
                <>
                    <p
                        className="graphique__axe fr-text--xs fr-mb-1w"
                        aria-hidden="true"
                    >
                        Nombre d’utilisateurs
                    </p>
                    {/* Outside the aria-hidden part, so the keyboard can scroll
                        it. */}
                    <div
                        ref={defilement}
                        className="graphique__defilement"
                        role="region"
                        aria-label={`Graphique : ${TITRE.toLowerCase()}`}
                        tabIndex={0}
                    >
                        <ol className="graphique__barres" aria-hidden="true">
                            {semaines.map(({ semaine, utilisateurs }) => (
                                <li
                                    key={semaine}
                                    className="graphique__semaine"
                                >
                                    <div className="graphique__colonne">
                                        <span className="graphique__valeur">
                                            {formatNumber(utilisateurs)}
                                        </span>
                                        <span
                                            className="graphique__barre"
                                            // Share of the tallest bar; CSS
                                            // turns it into a height.
                                            style={
                                                {
                                                    '--part':
                                                        utilisateurs / max,
                                                } as CSSProperties
                                            }
                                        />
                                    </div>
                                    <span className="graphique__lundi">
                                        {lundiCourt(semaine)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <table className="fr-sr-only">
                        <caption>{TITRE}</caption>
                        <thead>
                            <tr>
                                <th scope="col">Semaine du</th>
                                <th scope="col">Utilisateurs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semaines.map(({ semaine, utilisateurs }) => (
                                <tr key={semaine}>
                                    <th scope="row">{lundiLong(semaine)}</th>
                                    <td>{formatNumber(utilisateurs)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    )
}
