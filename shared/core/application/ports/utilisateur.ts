import type { Utilisateur } from '@shared/core/domain/entities/utilisateur'

export interface UtilisateurPort {
    list(): Promise<readonly Utilisateur[]>
}
