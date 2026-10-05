import '@gouvfr/dsfr/dist/component/alert/alert.main.min.css'
import { formatExtractedAt } from '../../format-extracted-at'

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
                extraite{lineCount > 1 ? 's' : ''} le {formatExtractedAt(date)}
            </p>
        </div>
    )
}
