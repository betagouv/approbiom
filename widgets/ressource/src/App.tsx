import { useGrist } from '@shared/hooks/useGrist'
import GristGate from '@shared/components/GristGate'
import { indexByKey } from '@shared/grist/api/client'

import { SPEC } from './grist'
import Ressource from './components/Ressource'

export default function App() {
    const gristState = useGrist(SPEC)

    return (
        <main className="app">
            <GristGate state={gristState}>
                {(data) => {
                    const metaRessourceById = indexByKey(
                        data.Meta_Ressource,
                        (row) => row.id
                    )
                    const entrepriseById = indexByKey(
                        data.Entreprise,
                        (row) => row.id
                    )
                    const departementById = indexByKey(
                        data.INSEE_Departement,
                        (row) => row.id
                    )

                    return (
                        <Ressource
                            plans={data.Plan_d_approvisionnement}
                            ressources={
                                data.Approvisionnement_summary_Plan_d_approvisionnement_Ressource
                            }
                            regions={
                                data.Approvisionnement_summary_Plan_d_approvisionnement_Region_Ressource
                            }
                            fournisseurs={
                                data.Approvisionnement_summary_Fournisseur_Plan_d_approvisionnement_Ressource
                            }
                            departements={
                                data.Approvisionnement_summary_Departement_de_provenance_Plan_d_approvisionnement_Ressource
                            }
                            metaRessourceById={metaRessourceById}
                            entrepriseById={entrepriseById}
                            departementById={departementById}
                        />
                    )
                }}
            </GristGate>
        </main>
    )
}
