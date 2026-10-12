import './EmptyPlan.css'

export default function EmptyPlan() {
    return (
        <div className="empty-plan">
            <p className="fr-text--md fr-m-0 empty-plan__title">
                Aucun approvisionnement pour ce plan
            </p>
            <p className="fr-text--sm fr-m-0 empty-plan__hint">
                Ajoutez-les par saisie manuelle.
            </p>
        </div>
    )
}
