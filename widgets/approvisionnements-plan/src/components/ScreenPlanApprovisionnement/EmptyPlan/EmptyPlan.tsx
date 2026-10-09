import './EmptyPlan.css'

export type EmptyPlanProps = {
    hasAttachments: boolean
}

export default function EmptyPlan({ hasAttachments }: EmptyPlanProps) {
    return (
        <div className="empty-plan">
            <p className="fr-text--md fr-m-0 empty-plan__title">
                Aucun approvisionnement pour ce plan
            </p>
            <p className="fr-text--sm fr-m-0 empty-plan__hint">
                {hasAttachments
                    ? 'Ajoutez-les par saisie manuelle ou à partir du document BCIB/BCIAT joint au plan.'
                    : "Ajoutez-les par saisie manuelle. Aucune pièce jointe n'est liée à ce plan pour importer un document BCIB/BCIAT."}
            </p>
        </div>
    )
}
