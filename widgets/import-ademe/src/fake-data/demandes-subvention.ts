import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'

// Stands in for the Demande_de_subvention table outside Grist.
export const FAKE_DEMANDES_SUBVENTION: readonly DemandeSubvention[] = [
    { id: 1, programmeAide: 1, planDApprovisionnement: 1 },
    { id: 2, programmeAide: 1, planDApprovisionnement: 2 },
    { id: 3, programmeAide: 2, planDApprovisionnement: 3 },
    { id: 4, programmeAide: 3, planDApprovisionnement: 4 },
    { id: 5, programmeAide: 2, planDApprovisionnement: 5 },
    { id: 6, programmeAide: 1, planDApprovisionnement: 7 },
    { id: 7, programmeAide: 3, planDApprovisionnement: 8 },
    { id: 8, programmeAide: 1, planDApprovisionnement: 9 },
    { id: 9, programmeAide: 3, planDApprovisionnement: 11 },
]
