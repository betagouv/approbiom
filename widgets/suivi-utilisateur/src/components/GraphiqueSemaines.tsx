import { formatNumber } from '@shared/react/format'
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { lundiCourt, lundiLong } from '../format-semaine'
import type { UtilisateursDeLaSemaine } from '../suivi-creations'

const TITRE = 'Utilisateurs ayant créé un plan, par semaine'

type GraphiqueSemainesProps = {
    semaines: readonly UtilisateursDeLaSemaine[]
}

/**
 * One bar per week, as tall as the users active in it. The bars are only
 * there to be seen: a table hidden from sight gives the same figures to
 * screen readers.
 */
export default function GraphiqueSemaines({
    semaines,
}: GraphiqueSemainesProps) {
    const defilement = useRef<HTMLDivElement>(null)

    // Once the weeks no longer fit, the chart opens on the latest ones: the
    // week under way, the one the figure beside it speaks of, is in view.
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
                    {/* Outside the hidden part, so that a keyboard can reach
                        and scroll it, and that the focus never lands on
                        something screen readers are told is not there. */}
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
                                            // The share of the tallest bar;
                                            // the stylesheet turns it into a
                                            // height.
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
