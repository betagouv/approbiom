import { formatNumber, plural } from '@shared/react/format'
import { lundiLong } from '../format-semaine'
import type { SuiviCreations } from '../suivi-creations'
import GraphiqueSemaines from './GraphiqueSemaines'

type CadreSemaineProps = {
    suivi: Pick<
        SuiviCreations,
        'semaines' | 'cetteSemaine' | 'nombreUtilisateurs'
    >
}

/** The users active this week, beside their number week after week. */
export default function CadreSemaine({ suivi }: CadreSemaineProps) {
    const { semaines, cetteSemaine, nombreUtilisateurs } = suivi

    return (
        <section className="cadre-semaine fr-mb-3w">
            <div className="cadre-semaine__chiffre">
                <h2 className="fr-h6 fr-mb-2w">
                    Utilisateurs ayant créé un plan cette semaine
                </h2>
                <p className="cadre-semaine__valeur fr-mb-1w">
                    {formatNumber(cetteSemaine.utilisateurs)}
                </p>
                <p className="fr-text--sm fr-mb-1w">
                    Semaine du {lundiLong(cetteSemaine.semaine)}
                </p>
                <p className="cadre-semaine__note fr-text--xs fr-mb-0">
                    {nombreUtilisateurs === 0
                        ? 'Aucun compte n’est coché « Utilisateur Approbiom » dans la table Utilisateur.'
                        : `Sur ${plural(nombreUtilisateurs, 'utilisateur')} (comptes cochés « Utilisateur Approbiom » dans la table Utilisateur).`}
                </p>
            </div>
            <div className="cadre-semaine__graphique">
                <GraphiqueSemaines semaines={semaines} />
            </div>
        </section>
    )
}
