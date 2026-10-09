import './DocumentPicker.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import Alert from '@shared/react/components/Alert'
import Badge from '@shared/react/components/Badge'
import type { ExtractionSummary } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { documentIconOf } from '@shared/react/components/document-icon'

const SIZE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const KO = 1024
const MO = KO * KO

function formatSize(bytes: number): string {
    if (bytes < KO) return `${SIZE.format(bytes)} o`

    return bytes < MO
        ? `${SIZE.format(Math.round(bytes / KO))} Ko`
        : `${SIZE.format(bytes / MO)} Mo`
}

function ExtractionState({ summary }: { summary?: ExtractionSummary }) {
    if (!summary || summary.lineCount === 0) return null

    return (
        <Badge size="sm" status="new" noIcon>
            Vérification en cours · {summary.verifiedCount}/{summary.lineCount}
        </Badge>
    )
}

export type DocumentPickerProps = {
    attachments: readonly Attachment[]
    extractions: ReadonlyMap<Attachment['id'], ExtractionSummary>
    selectedId: Attachment['id'] | null
    onSelect: (id: Attachment['id']) => void
}

export default function DocumentPicker({
    attachments,
    extractions,
    selectedId,
    onSelect,
}: DocumentPickerProps) {
    return (
        <fieldset className="fr-fieldset fr-mb-0 document-picker">
            <legend className="fr-fieldset__legend fr-text--regular">
                <span className="fr-text--md document-picker__title">
                    Document BCIB/BCIAT
                </span>
                <span className="fr-hint-text">
                    Sélectionnez la pièce jointe du plan à extraire
                </span>
            </legend>

            {attachments.length === 0 ? (
                <div className="document-picker__empty">
                    <Alert severity="info" size="sm">
                        Aucune pièce jointe n&apos;est liée à ce plan. Ajoutez
                        le document BCIB/BCIAT dans la table Piece_jointe, ou
                        créez les approvisionnements par saisie manuelle.
                    </Alert>
                </div>
            ) : (
                <ul className="fr-raw-list document-picker__grid">
                    {attachments.map((attachment) => {
                        const selected = attachment.id === selectedId

                        return (
                            <li key={attachment.id}>
                                <button
                                    type="button"
                                    className="document-picker__card"
                                    aria-pressed={selected}
                                    onClick={() => onSelect(attachment.id)}
                                >
                                    <span
                                        className={`${documentIconOf(attachment.name)} fr-icon--sm document-picker__icon`}
                                        aria-hidden="true"
                                    />
                                    <span className="document-picker__text">
                                        <span className="fr-text--sm document-picker__name">
                                            {attachment.name}
                                        </span>
                                        <span className="fr-text--xs document-picker__meta">
                                            {formatSize(attachment.sizeInBytes)}{' '}
                                            ·{' '}
                                            {attachment.type ||
                                                'type non renseigné'}
                                        </span>
                                        <ExtractionState
                                            summary={extractions.get(
                                                attachment.id
                                            )}
                                        />
                                    </span>
                                    {selected && (
                                        <span
                                            className="fr-icon-checkbox-circle-fill document-picker__check"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </fieldset>
    )
}
