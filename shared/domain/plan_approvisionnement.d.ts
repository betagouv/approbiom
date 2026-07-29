export type PlanStatus =
    'en fonctionnement' | 'obsolète' | 'projet' | 'abandonné'

export type PlanApprovisionnement = {
    id: number
    statut: PlanStatus | null
}
