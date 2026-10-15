import Badge from '@shared/react/components/Badge'
import type { EtatAdministratif } from '@shared/core/application/ports/entreprise-search'

// SIRENE dates carry no time, so they parse as midnight UTC: formatted in UTC,
// they show the same day east and west of Greenwich alike.
const DAY = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' })

const since = (date: string | null) =>
    date ? ` le ${DAY.format(new Date(date))}` : ''

export type EtatAdministratifBadgeProps = {
    etatAdministratif: EtatAdministratif
}

export default function EtatAdministratifBadge({
    etatAdministratif,
}: EtatAdministratifBadgeProps) {
    switch (etatAdministratif.etat) {
        case 'en-activite':
            return (
                <Badge status="success" size="sm">
                    En activité
                </Badge>
            )
        case 'cessee':
            return (
                <Badge status="error" size="sm">
                    Cessée{since(etatAdministratif.depuis)}
                </Badge>
            )
        case 'etablissement-ferme':
            return (
                <Badge status="warning" size="sm">
                    Établissement fermé{since(etatAdministratif.depuis)}
                </Badge>
            )
    }
}
