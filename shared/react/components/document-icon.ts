import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-media/icons-media.main.min.css'

// A document's DSFR icon, from its extension.
export function documentIconOf(name: string): string {
    const extension = name.split('.').pop()?.toLowerCase()

    if (extension === 'pdf') return 'fr-icon-file-pdf-line'
    if (extension === 'docx' || extension === 'doc')
        return 'fr-icon-file-text-line'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension ?? ''))
        return 'fr-icon-image-line'

    return 'fr-icon-file-line'
}
