export default function ExtractionLoading() {
    return (
        <div className="extraction__loading" role="status">
            <p className="fr-h6 fr-m-0">Extraction en cours…</p>
            <p className="fr-text--sm fr-m-0 extraction__mention">
                Lecture du document, extraction des données, transformation des
                données.
            </p>
            <div
                className="extraction__progress"
                role="progressbar"
                aria-label="Extraction en cours"
            >
                <div className="extraction__progress-bar" />
            </div>
        </div>
    )
}
