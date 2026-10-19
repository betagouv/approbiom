import {
    gristReady,
    onGristEditOptions,
} from '@shared/infrastructure/grist/helpers/grist-ready'
import { isNombreUtilisateurs, type OptionsPort } from './options'

const NOMBRE_UTILISATEURS = 'nombreUtilisateurs'

function subscribe(listeners: Set<() => void>, listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

function notify(listeners: Set<() => void>) {
    for (const listener of listeners) listener()
}

/**
 * Must be created before anything else reads the document: it is what puts
 * « Ouvrir la configuration » in the widget's creator panel, and Grist only
 * hears about that at the handshake (see `onGristEditOptions`).
 */
export function createGristOptionsPort(): OptionsPort {
    const editListeners = new Set<() => void>()
    const changeListeners = new Set<() => void>()
    let listening = false

    onGristEditOptions(() => notify(editListeners))

    async function ready() {
        await gristReady()

        // Grist sends the options again each time they change: when the
        // widget sets them, and when the user saves or reverts them from the
        // section's header. Listened to only once the handshake is over, so
        // that its own message — the options about to be read anyway — does
        // not count as a change.
        if (!listening) {
            listening = true
            grist.onOptions(() => notify(changeListeners))
        }
    }

    return {
        async read() {
            await ready()

            // Saved by this widget, but kept in the document as free-form
            // JSON: never trusted to still be a valid number.
            const value: unknown = await grist.getOption(NOMBRE_UTILISATEURS)

            return {
                nombreUtilisateurs: isNombreUtilisateurs(value) ? value : null,
            }
        },

        async save({ nombreUtilisateurs }) {
            await ready()

            await grist.setOption(NOMBRE_UTILISATEURS, nombreUtilisateurs)
        },

        onEdit: (listener) => subscribe(editListeners, listener),

        onChange: (listener) => subscribe(changeListeners, listener),
    }
}
