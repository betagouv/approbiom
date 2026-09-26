// DSFR's « modale ». The stylesheet is DSFR's; its script is not loaded in a
// Grist widget, so what it does is done here: focus trapping and restoring,
// Escape and overlay clicks, and freezing the page behind.
//
// https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/modale
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/modal/modal.main.min.css'
import './Modal.css'

import { useEffect, useId, useRef } from 'react'
import type { ModalProps, ModalSize } from './Modal.types'

// The grid columns DSFR uses for each size.
const COLUMNS: Record<ModalSize, string> = {
    sm: 'fr-col-12 fr-col-md-6 fr-col-lg-4',
    md: 'fr-col-12 fr-col-md-8 fr-col-lg-6',
    lg: 'fr-col-12 fr-col-md-10 fr-col-lg-8',
}

const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Freezes the page behind, the way the DSFR script does: `data-fr-scrolling`
// fixes the body, which is moved up so the page does not jump to its top.
function freezePage(): () => void {
    const root = document.documentElement
    const scrollY = window.scrollY

    root.style.setProperty(
        '--scrollbar-width',
        `${window.innerWidth - root.clientWidth}px`
    )
    root.setAttribute('data-fr-scrolling', 'false')
    document.body.style.top = `-${scrollY}px`

    return () => {
        root.removeAttribute('data-fr-scrolling')
        root.style.removeProperty('--scrollbar-width')
        document.body.style.top = ''
        window.scrollTo(0, scrollY)
    }
}

export default function Modal({
    open,
    onClose,
    title,
    titleAs: Title = 'h2',
    titleIcon,
    size = 'md',
    alignTopOnMobile = false,
    children,
    actions,
}: ModalProps) {
    const id = useId()
    const titleId = `${id}-title`
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!open || !dialog) return

        // Where the focus goes back to: the button that opened the modal.
        const opener =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null

        // `showModal` traps the focus inside the modal.
        if (typeof dialog.showModal === 'function') dialog.showModal()
        else dialog.setAttribute('open', '')

        // DSFR puts the focus on the first focusable element: « Fermer ».
        dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus()

        const unfreeze = freezePage()

        return () => {
            unfreeze()
            if (typeof dialog.close === 'function') dialog.close()
            else dialog.removeAttribute('open')
            // A button that disappeared in the meantime has nowhere to return to.
            if (opener?.isConnected) opener.focus()
        }
    }, [open])

    const className = [
        'fr-modal',
        'shared-modal',
        open && 'fr-modal--opened',
        alignTopOnMobile && 'fr-modal--top',
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <dialog
            ref={dialogRef}
            className={className}
            aria-labelledby={titleId}
            aria-modal={open || undefined}
            // Escape: closed by the caller, not by the browser on its own.
            onCancel={(event) => {
                event.preventDefault()
                onClose()
            }}
            // The overlay is the dialog itself: the containers inside let
            // clicks through, only the body catches them.
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            {open && (
                <div className="fr-container fr-container--fluid fr-container-md">
                    <div className="fr-grid-row fr-grid-row--center">
                        <div className={COLUMNS[size]}>
                            <div className="fr-modal__body">
                                <div className="fr-modal__header">
                                    <button
                                        type="button"
                                        className="fr-btn--close fr-btn"
                                        title="Fermer"
                                        onClick={onClose}
                                    >
                                        Fermer
                                    </button>
                                </div>
                                <div className="fr-modal__content">
                                    <Title
                                        id={titleId}
                                        className="fr-modal__title"
                                    >
                                        {titleIcon && (
                                            <span
                                                className={`${titleIcon} fr-icon--lg`}
                                                aria-hidden="true"
                                            />
                                        )}
                                        {title}
                                    </Title>
                                    {children}
                                </div>
                                {actions && (
                                    <div className="fr-modal__footer">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </dialog>
    )
}
