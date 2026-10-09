import './DocumentContext.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState, type ReactNode } from 'react'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { documentIconOf } from '@shared/react/components/document-icon'

export type DocumentContextProps = {
    attachment: Attachment
    getAttachmentUrl: (id: Attachment['id']) => Promise<string>
    // Shown after the document, such as a badge or an action.
    children?: ReactNode
}

// Which document the import is about, with a link to download it.
export default function DocumentContext({
    attachment,
    getAttachmentUrl,
    children,
}: DocumentContextProps) {
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
        <div className="fr-text--sm fr-m-0 document-context">
            <span className="document-context__document">
                <span className="document-context__mention">Document : </span>
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
            {children}
        </div>
    )
}
