export type SuiviUtilisateurOptions = {
    /** How many people use Approbiom; null until someone fills it in. */
    nombreUtilisateurs: number | null
}

/** The widget's own settings, kept by Grist along with the widget. */
export interface OptionsPort {
    read(): Promise<SuiviUtilisateurOptions>
    /**
     * Grist keeps what is saved as a draft, until the user saves or reverts it
     * from the widget's header.
     */
    save(options: SuiviUtilisateurOptions): Promise<void>
    /**
     * Calls `listener` each time the user asks to configure the widget.
     * Returns what stops it.
     */
    onEdit(listener: () => void): () => void
    /**
     * Calls `listener` each time the options change, from the widget or from
     * Grist. Returns what stops it.
     */
    onChange(listener: () => void): () => void
}

export const isNombreUtilisateurs = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value > 0
