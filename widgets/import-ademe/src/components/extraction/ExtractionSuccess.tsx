import '@gouvfr/dsfr/dist/component/alert/alert.main.min.css'

const DATE = new Intl.DateTimeFormat('fr-FR')

export type ExtractionSuccessProps = {
    lineCount: number
    date: Date
}

export default function ExtractionSuccess({
    lineCount,
    date,
}: ExtractionSuccessProps) {
    return (
        <div className="fr-alert fr-alert--success fr-alert--sm">
            <p>
                Extraction réussie — {lineCount} ligne{lineCount > 1 ? 's' : ''}{' '}
                extraite{lineCount > 1 ? 's' : ''} le {DATE.format(date)}
            </p>
        </div>
    )
}
