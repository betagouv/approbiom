import JsonTree from './JsonTree'
import type { RawResult } from '../hooks/useRawResult'

export default function RawResultView({ result }: { result: RawResult }) {
    switch (result.status) {
        case 'idle':
            return null
        case 'loading':
            return <p className="fr-mt-2w">Chargement…</p>
        case 'error':
            return <pre className="fr-mt-2w result">{result.message}</pre>
        case 'done':
            return (
                <div className="fr-mt-2w result">
                    <JsonTree value={result.value} />
                </div>
            )
    }
}
