import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'
import './Drawer.css'
import Tag from '@shared/components/Tag'
import type { Plan_d_approvisionnement } from '@shared/grist/approbiom/tables'
import { useEffect, useId, useRef } from 'react'

const A_VENIR = 'À venir'

export type DrawerProps = {
    plan: Plan_d_approvisionnement
    onClose: () => void
}

export default function Drawer({ plan, onClose }: DrawerProps) {
    const titleId = useId()
    const closeRef = useRef<HTMLButtonElement>(null)

    // Focus goes into the panel, or a keyboard user would still be behind it,
    // tabbing through a table they can no longer see.
    useEffect(() => {
        closeRef.current?.focus()
    }, [])

    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose()
        }

        // On the document rather than on the panel: Escape has to work wherever
        // the focus has wandered inside it.
        document.addEventListener('keydown', closeOnEscape)

        return () => {
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [onClose])

    return (
        <>
            {/* Clicking beside the panel closes it, as DSFR's own modal does.
                Deliberately not a button: the close button is what the keyboard
                reaches, and a second one here would only pad the tab order. */}
            <div className="drawer__backdrop" onClick={onClose} />

            <section
                className="drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <button
                    ref={closeRef}
                    type="button"
                    className="fr-btn fr-btn--close"
                    onClick={onClose}
                >
                    Fermer
                </button>

                <div className="drawer__heading">
                    <h2 className="fr-h2 drawer__title" id={titleId}>
                        {plan.Nom}
                    </h2>
                    <Tag color="purple-glycine">Avis préfet : {A_VENIR}</Tag>
                </div>

                <p className="fr-text--sm drawer__pending fr-mb-4w">
                    Demande d’aide déposée le : {A_VENIR}
                </p>

                <dl className="drawer__facts fr-mb-4w">
                    <div className="fr-text--sm">
                        <dt>Appel à projet&nbsp;:&nbsp;</dt>
                        <dd className="fr-text--bold">
                            {plan.Appel_a_projet || 'Aucun'}
                        </dd>
                    </div>
                    <div className="fr-text--sm">
                        <dt>Porteur du projet&nbsp;:&nbsp;</dt>
                        <dd className="drawer__pending">{A_VENIR}</dd>
                    </div>
                    <div className="fr-text--sm">
                        <dt>Agent(s) instructeur(s)&nbsp;:&nbsp;</dt>
                        <dd className="drawer__pending">{A_VENIR}</dd>
                    </div>
                </dl>

                <section className="drawer__panel fr-p-3w fr-mb-3w">
                    <h3 className="fr-text--md">Pièces du dossier</h3>
                    <p className="drawer__pending fr-mb-3w">{A_VENIR}</p>

                    <ul className="fr-btns-group fr-btns-group--inline-md">
                        <li>
                            <button
                                type="button"
                                className="fr-btn fr-btn--secondary"
                                disabled
                            >
                                Voir le dossier complet
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-download-line"
                                disabled
                            >
                                Télécharger le dossier complet
                            </button>
                        </li>
                    </ul>
                </section>

                <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-12 fr-col-md-6">
                        <section className="drawer__panel fr-p-3w">
                            <h3 className="fr-text--md">
                                Chronologie du dossier
                            </h3>
                            <p className="drawer__pending">{A_VENIR}</p>
                        </section>
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                        <section className="drawer__panel fr-p-3w">
                            <h3 className="fr-text--md">Actions</h3>
                            <ul className="fr-btns-group">
                                <li>
                                    <button
                                        type="button"
                                        className="fr-btn fr-btn--secondary"
                                        disabled
                                    >
                                        Éditer les statuts
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="fr-btn fr-btn--secondary"
                                        disabled
                                    >
                                        Importer la synthèse CRB
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="fr-btn fr-btn--secondary"
                                        disabled
                                    >
                                        Importer la lettre du préfet
                                    </button>
                                </li>
                            </ul>
                            <p className="drawer__pending">{A_VENIR}</p>
                        </section>
                    </div>
                </div>
            </section>
        </>
    )
}
