import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

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

export type AttachmentPickerProps = {
    attachments: readonly Attachment[]
    selectedId: Attachment['id'] | null
    onSelect: (id: Attachment['id']) => void
}

export default function AttachmentPicker({
    attachments,
    selectedId,
    onSelect,
}: AttachmentPickerProps) {
    const count = attachments.length

    return (
        <fieldset className="fr-fieldset fr-mb-0 attachment-picker">
            <legend className="fr-fieldset__legend fr-text--regular">
                <span className="fr-h6">Pièces jointes du plan</span>
                <span className="fr-hint-text">
                    {count} document{count > 1 ? 's' : ''} · sélectionnez le
                    document ADEME
                </span>
            </legend>

            {count === 0 ? (
                <p className="fr-text--sm attachment-picker__empty">
                    Aucune pièce jointe n&apos;est liée à ce plan.
                </p>
            ) : (
                <ul className="fr-raw-list attachment-picker__grid">
                    {attachments.map((attachment) => {
                        const selected = attachment.id === selectedId

                        return (
                            <li key={attachment.id}>
                                <button
                                    type="button"
                                    className="attachment-picker__card"
                                    aria-pressed={selected}
                                    onClick={() => onSelect(attachment.id)}
                                >
                                    <span
                                        className={`${documentIconOf(attachment.name)} fr-icon--sm attachment-picker__icon`}
                                        aria-hidden="true"
                                    />
                                    <span className="attachment-picker__text">
                                        <span className="fr-text--sm attachment-picker__name">
                                            {attachment.name}
                                        </span>
                                        <span className="fr-text--xs attachment-picker__meta">
                                            {formatSize(attachment.sizeInBytes)}
                                        </span>
                                    </span>
                                    {selected && (
                                        <span
                                            className="fr-icon-checkbox-circle-fill attachment-picker__check"
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
