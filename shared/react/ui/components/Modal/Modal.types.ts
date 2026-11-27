import type { ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg'

export type ModalProps = {
    open: boolean
    // « Fermer », Escape and overlay click; closes only once `open` is false.
    onClose: () => void
    // Required by DSFR: it is also the modal's accessible name.
    title: ReactNode
    // Defaults to h2.
    titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'
    // e.g. `fr-icon-info-line`.
    titleIcon?: string
    // Defaults to md.
    size?: ModalSize
    alignTopOnMobile?: boolean
    children: ReactNode
    actions?: ReactNode
}
