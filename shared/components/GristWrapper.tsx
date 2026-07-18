import { useEffect, useState, type ReactNode } from 'react'

// No import for `grist`: grist-plugin-api.js is loaded by a <script> tag in
// index.html and installs `grist` as a global. shared/grist/grist-plugin-api.d.ts
// is what makes it typed.

type GristWrapperProps = {
    requiredAccess: string
    children: ReactNode
}

/**
 * Handles the Grist handshake and only renders its children once Grist is
 * connected and the required access level has been granted. Children can
 * therefore call the Grist API straight from their mount effect.
 */
export default function GristWrapper({
    requiredAccess,
    children,
}: GristWrapperProps) {
    // null until Grist answers the ready handshake, then the granted access level.
    const [accessLevel, setAccessLevel] = useState<string | null>(null)

    useEffect(() => {
        // onOptions is called on the initial ready message, so it tells us both
        // that Grist is connected and which access level was granted.
        grist.onOptions((_options, settings) => {
            setAccessLevel(settings.accessLevel)
        })
        grist.ready({ requiredAccess })
    }, [requiredAccess])

    if (accessLevel === null) {
        return <p>Connexion à Grist en cours…</p>
    }

    if (accessLevel !== requiredAccess) {
        return (
            <p>
                Ce widget a besoin d’un accès complet au document. Ouvrez le
                panneau de configuration du widget et choisissez « Accès complet
                au document ».
            </p>
        )
    }

    return <>{children}</>
}
