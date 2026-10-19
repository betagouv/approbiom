import Alert from '@shared/react/components/Alert'
import DataTable, { type Column } from '@shared/react/components/DataTable'
import { formatNumber, plural } from '@shared/react/format'
import {
    partDesCreateurs,
    type CreationsDeLaSemaine,
    type SuiviCreations,
} from '../suivi-creations'
import Indicateur from './Indicateur'

const DATE = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeZone: 'Europe/Paris',
})

// A `Semaine` is a calendar day, read as midnight UTC: formatted in UTC so that
// no time zone moves it to the day before.
const LUNDI = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeZone: 'UTC',
})

const POURCENTAGE = new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1,
})

const COLONNES: Column<CreationsDeLaSemaine>[] = [
    {
        id: 'semaine',
        header: 'Semaine du',
        render: ({ semaine }) => LUNDI.format(new Date(semaine)),
        sortBy: ({ semaine }) => semaine,
    },
    {
        id: 'utilisateur',
        header: 'Utilisateur',
        render: ({ utilisateur }) => utilisateur ?? 'Utilisateur inconnu',
        sortBy: ({ utilisateur }) => utilisateur ?? '',
    },
    {
        id: 'plans',
        header: 'Plans créés',
        render: ({ plans }) => plans,
        sortBy: ({ plans }) => plans,
    },
]

type TableauDeBordProps = {
    suivi: SuiviCreations
    nombreUtilisateurs: number | null
}

export default function TableauDeBord({
    suivi,
    nombreUtilisateurs,
}: TableauDeBordProps) {
    const part = partDesCreateurs(suivi, nombreUtilisateurs)

    return (
        <>
            <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
                <div className="fr-col-12 fr-col-md-6">
                    <Indicateur
                        titre="Plans créés"
                        valeur={formatNumber(suivi.totalPlans)}
                        detail={
                            suivi.premiereCreation
                                ? `Depuis le ${DATE.format(suivi.premiereCreation)}`
                                : 'Depuis le début du suivi'
                        }
                    />
                </div>
                <div className="fr-col-12 fr-col-md-6">
                    {part === null || nombreUtilisateurs === null ? (
                        <Indicateur
                            titre="Utilisateurs ayant créé un plan"
                            valeur="Non configuré"
                            detail="Renseignez le nombre total d’utilisateurs dans la configuration du widget."
                        />
                    ) : (
                        <Indicateur
                            titre="Utilisateurs ayant créé un plan"
                            valeur={POURCENTAGE.format(part)}
                            barre={part}
                            detail={`${plural(suivi.nombreCreateurs, 'utilisateur')} sur ${formatNumber(nombreUtilisateurs)}`}
                            note="Le nombre total d’utilisateurs est saisi à la main, dans la configuration du widget."
                        />
                    )}
                </div>
            </div>
            {suivi.lignes.length === 0 ? (
                <Alert severity="info" title="Aucun plan créé">
                    Information : aucun plan n’a été créé depuis le début du
                    suivi.
                </Alert>
            ) : (
                <DataTable
                    caption="Plans créés par utilisateur et par semaine"
                    rows={suivi.lignes}
                    columns={COLONNES}
                    bordered
                />
            )}
        </>
    )
}
