import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import Tabs from '@shared/react/components/Tabs'
import DocComparison from './components/DocComparison'
import StateComparison from './components/StateComparison'

export default function App() {
    return (
        <main className="fr-container fr-py-2w">
            <Tabs
                label="Comparaisons"
                items={[
                    {
                        id: 'states',
                        label: 'Comparer deux états',
                        content: <StateComparison />,
                    },
                    {
                        id: 'documents',
                        label: 'Comparer deux documents',
                        content: <DocComparison />,
                    },
                ]}
            />
        </main>
    )
}
