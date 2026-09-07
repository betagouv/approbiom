import '@gouvfr/dsfr/dist/core/core.main.min.css'
import AsyncGate from '@shared/react/AsyncGate'
import { useGristSubscription } from '@shared/react/UseGristSubscription'
import { toSelectedAttachment } from '@shared/infrastructure/grist/grist-selected-attachment'
import Import from './components/Import'

export default function App() {
    const state = useGristSubscription(toSelectedAttachment)

    return (
        <main className="app">
            <AsyncGate state={state}>
                {(attachment) => (
                    <Import selectedAttachment={attachment ?? undefined} />
                )}
            </AsyncGate>
        </main>
    )
}
