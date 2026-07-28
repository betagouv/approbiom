import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'
import './Drawer.css'

import { useEffect, useState } from 'react'
import {
    getAttachmentUrlBuilder,
    type AttachmentUrlBuilder,
} from '@shared/grist/api/client'
import { getAttachmentIds } from '../../utils'
import type { PieceJointeAccueil } from '../../grist'

const TYPE_NON_RENSEIGNE = 'Type non renseigné'

export type CardPiecesJointesProps = {
    piecesJointes: readonly PieceJointeAccueil[]
}

export default function CardPiecesJointes({
    piecesJointes,
}: CardPiecesJointesProps) {
    const [buildAttachmentUrl, setBuildAttachmentUrl] =
        useState<AttachmentUrlBuilder | null>(null)

    // The token is asked for when the panel opens rather than up front: it lives
    // a few minutes, which is about as long as the panel stays on screen.
    useEffect(() => {
        let cancelled = false

        getAttachmentUrlBuilder()
            .then((build) => {
                // Stored behind a function, or `useState` would take the builder
                // for an updater and call it instead of keeping it.
                if (!cancelled) setBuildAttachmentUrl(() => build)
            })
            // Outside Grist — the fictional-data preview — there is no token to
            // be had, and the pièces stay listed without a link to their file.
            .catch(() => undefined)

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section className="drawer__panel fr-p-3w fr-mb-3w">
            <h3 className="fr-text--md">Pièces du dossier</h3>

            {piecesJointes.length === 0 ? (
                <p className="drawer__pending fr-mb-3w">
                    Aucune pièce rattachée à ce plan
                </p>
            ) : (
                <ul className="fr-mb-3w">
                    {piecesJointes.map((piece) => (
                        <li key={piece.id} className="fr-text--sm">
                            {piece.type || TYPE_NON_RENSEIGNE}
                            {buildAttachmentUrl &&
                                getAttachmentIds(piece.piece_jointe).map(
                                    (attachmentId) => (
                                        <a
                                            key={attachmentId}
                                            className="fr-link fr-ml-2v"
                                            href={buildAttachmentUrl(
                                                attachmentId
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Télécharger
                                        </a>
                                    )
                                )}
                        </li>
                    ))}
                </ul>
            )}

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
    )
}
