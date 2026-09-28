import './ImportContext.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState, type ReactNode } from 'react'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { documentIconOf } from '@shared/react/components/document-icon'
import type { SelectablePlan } from '../selection'

export type ImportContextProps = {
    plan: SelectablePlan
    attachment: Attachment
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
    // Shown at the end of the line, such as a status badge.
    children?: ReactNode
}

// Which plan and which document the step is about.
export default function ImportContext({
    plan,
    attachment,
    getAttachmentUrl,
    children,
}: ImportContextProps) {
    const [downloadFailed, setDownloadFailed] = useState(false)

    // The URL carries an access token that expires: it is asked for on click.
    async function download() {
        setDownloadFailed(false)
        try {
            const link = document.createElement('a')
            link.href = await getAttachmentUrl(attachment.id)
            link.download = attachment.name
            link.click()
        } catch {
            setDownloadFailed(true)
        }
    }

    return (
        <div className="fr-text--sm fr-m-0 import-context">
            <span>
                <span className="import-context__mention">Plan : </span>
                {plan.nom}
            </span>
            <span className="import-context__document">
                <span className="import-context__mention">Document : </span>
                <span
                    className={`${documentIconOf(attachment.name)} fr-icon--sm`}
                    aria-hidden="true"
                />
                <button
                    type="button"
                    className="fr-link fr-link--sm fr-link--icon-right fr-icon-download-line"
                    onClick={() => void download()}
                >
                    <span className="fr-sr-only">Télécharger </span>
                    {attachment.name}
                </button>
            </span>
            {downloadFailed && (
                <span className="fr-error-text fr-mt-0" role="alert">
                    Le téléchargement a échoué. Réessayez.
                </span>
            )}
            {children && (
                <span className="import-context__left">{children}</span>
            )}
        </div>
    )
}
