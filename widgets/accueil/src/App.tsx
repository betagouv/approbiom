import { useGrist } from '@shared/hooks/useGrist'
import GristGate from '@shared/components/GristGate'
import Accueil from './components/Accueil'
import { ACCUEIL_SPEC } from './grist'
import { FAKE_PLANS } from './data/fakePlans'

export default function App() {
    const gristState = useGrist(ACCUEIL_SPEC)

    return (
        <main className="app">
            <GristGate
                state={gristState}
                fakeData={{ Plan_d_approvisionnement: FAKE_PLANS }}
            >
                {(data) => (
                    <Accueil
                        plansApprovisionnement={data.Plan_d_approvisionnement}
                    />
                )}
            </GristGate>
        </main>
    )
}
