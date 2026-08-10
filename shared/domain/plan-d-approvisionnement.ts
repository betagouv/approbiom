export type PlanStatus =
    'en fonctionnement' | 'obsolète' | 'projet' | 'abandonné'

export type PlanDApprovisionnement = {
    id: number
    statut: PlanStatus | null
    nom: string
}
