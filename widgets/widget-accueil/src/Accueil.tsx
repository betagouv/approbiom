import type { Plan_d_approvisionnement } from '@shared/grist/approbiom/tables'

export type AccueilProps = {
    plansApprovisionnement: Plan_d_approvisionnement[]
}

export default function Accueil({ plansApprovisionnement }: AccueilProps) {
    return (
        <div>
            <h1>Accueil</h1>
            {plansApprovisionnement.map((plan) => plan.Appel_a_projet).join()}
        </div>
    )
}
