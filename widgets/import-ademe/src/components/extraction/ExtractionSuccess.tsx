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
                Extraction réussie — {lineCount} lignes extraites le{' '}
                {DATE.format(date)}
            </p>
        </div>
    )
}
