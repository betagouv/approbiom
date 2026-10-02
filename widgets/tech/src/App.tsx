import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/component/input/input.main.min.css'
import Tabs from '@shared/react/components/Tabs'
import Comparisons from './components/Comparisons'
import UserActions from './components/UserActions'

export default function App() {
    return (
        <main className="fr-container fr-py-2w">
            <Tabs
                label="Navigation principale"
                items={[
                    {
                        id: 'comparisons',
                        label: 'Comparer des états',
                        content: <Comparisons />,
                    },
                    {
                        id: 'user-actions',
                        label: 'Appliquer des actions utilisateurs',
                        content: <UserActions />,
                    },
                ]}
            />
        </main>
    )
}
