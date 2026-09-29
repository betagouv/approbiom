import '@gouvfr/dsfr/dist/component/link/link.main.min.css'

interface EndpointDocProps {
    endpoint: string
    operationId: string
}

export default function EndpointDoc({
    endpoint,
    operationId,
}: EndpointDocProps) {
    return (
        <div className="fr-mb-2w">
            <p className="fr-text--sm fr-mb-0">
                Endpoint <code>{endpoint}</code> :{' '}
                <a
                    className="fr-link fr-text--sm"
                    href={`https://support.getgrist.com/api/#operation/${operationId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    documentation de l’API Grist
                </a>
            </p>
        </div>
    )
}
