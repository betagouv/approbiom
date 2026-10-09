import './ExtractionsInProgress.css'
import '@gouvfr/dsfr/dist/component/alert/alert.main.min.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-arrows/icons-arrows.main.min.css'

import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { documentIconOf } from '@shared/react/components/document-icon'
import { formatExtractedAt } from '../../../format-extracted-at'

export type ExtractionInProgress = {
    attachment: Attachment
    summary: ExtractionSummary
}

export type ExtractionsInProgressProps = {
    extractions: readonly ExtractionInProgress[]
    onResume: (id: Attachment['id']) => void
}

export default function ExtractionsInProgress({
    extractions,
    onResume,
}: ExtractionsInProgressProps) {
    if (extractions.length === 0) return null

    return (
        <div className="fr-alert fr-alert--info fr-alert--sm">
            <p className="fr-mb-1w extractions-in-progress__title">
                {extractions.length > 1
                    ? `${extractions.length} extractions en cours`
                    : 'Extraction en cours'}
            </p>
            <ul className="fr-raw-list">
                {extractions.map(({ attachment, summary }) => (
                    <li
                        key={attachment.id}
                        className="extractions-in-progress__item"
                    >
                        <span
                            className={`${documentIconOf(attachment.name)} fr-icon--sm extractions-in-progress__icon`}
                            aria-hidden="true"
                        />
                        <span className="fr-text--sm fr-m-0 extractions-in-progress__text">
                            <span className="extractions-in-progress__name">
                                {attachment.name}
                            </span>
                            <span className="extractions-in-progress__mention">
                                {' '}
                                · {summary.verifiedCount}/{summary.lineCount}{' '}
                                lignes vérifiées
                                {summary.extractedAt &&
                                    ` · extraite le ${formatExtractedAt(summary.extractedAt)}`}
                            </span>
                        </span>
                        <button
                            type="button"
                            className="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-right fr-icon-arrow-right-line"
                            onClick={() => onResume(attachment.id)}
                        >
                            Reprendre la vérification{' '}
                            <span className="fr-sr-only">
                                de {attachment.name}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
