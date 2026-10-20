import type { UtilisateurPort } from '@shared/core/application/ports/utilisateur'
import { gristReady } from '../helpers/grist-ready'
import {
    asBoolean,
    asNumber,
    asString,
    fetchRowsOnce,
} from '../helpers/grist-helpers'
import { COLUMNS, TABLE } from '../types/grist-tables'

export function createGristUtilisateurPort(): UtilisateurPort {
    return {
        async list() {
            await gristReady()

            const rows = await fetchRowsOnce(
                TABLE.utilisateur,
                COLUMNS.utilisateur
            )

            return rows.map((row) => ({
                id: asNumber(row.id) ?? 0,
                email: asString(row.Email),
                utilisateurApprobiom: asBoolean(row.Utilisateur_Approbiom),
            }))
        },
    }
}
