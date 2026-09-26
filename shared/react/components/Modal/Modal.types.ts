import type { ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg'

export type ModalProps = {
    open: boolean
    // Called by the « Fermer » button, Escape and a click on the overlay. The
    // modal is controlled: it only closes once the caller sets `open` to false.
    onClose: () => void
    // Required by DSFR: it is also the modal's accessible name.
    title: ReactNode
    // A heading level from h2 to h6, or a paragraph, depending on where the
    // modal sits in the page. Defaults to h2.
    titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'
    // A DSFR icon class shown before the title, such as `fr-icon-info-line`.
    titleIcon?: string
    // Adapts the width to the content. Defaults to md.
    size?: ModalSize
    // Aligns the modal to the top of the screen on mobile, instead of the bottom.
    alignTopOnMobile?: boolean
    children: ReactNode
    // The fixed action zone: a primary button, or a group of buttons.
    actions?: ReactNode
}
