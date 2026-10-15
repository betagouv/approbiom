import Badge from '@shared/react/components/Badge'
import type { EtatAdministratif } from '@shared/core/application/ports/entreprise-search'

// SIRENE dates come as YYYY-MM-DD. Rearranged rather than parsed as a Date,
// they show the same day in every time zone, and one that does not read as a
// date is left out instead of bringing the widget down.
function since(date: string | null): string {
    const [, year, month, day] = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []

    return year ? ` le ${day}/${month}/${year}` : ''
}

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
