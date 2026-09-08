import AsyncGate from '@shared/react/AsyncGate'
import { useGristSubscription } from '@shared/react/UseGristSubscription'
import { toSelectedAttachment } from '@shared/infrastructure/grist/grist-selected-attachment'
import Import from './components/Import'

const getTransformedImportDataFromFile = () =>
    Promise.reject(
        new Error("la transformation des données n'est pas encore implémentée")
    )

export default function App() {
    const state = useGristSubscription(toSelectedAttachment)

    return (
        <main className="app">
            <AsyncGate state={state}>
                {(attachment) => (
                    <Import
                        selectedAttachment={attachment ?? undefined}
                        getTransformedImportDataFromFile={
                            getTransformedImportDataFromFile
                        }
                    />
                )}
            </AsyncGate>
        </main>
    )
}
