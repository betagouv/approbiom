import type { Attachment } from '@shared/core/domain/entities/attachment'
import { documentIconOf } from '@shared/react/components/document-icon'
import type { SelectablePlan } from '../selection'

export type ExtractionContextProps = {
    plan: SelectablePlan
    attachment: Attachment
}

export default function ExtractionContext({
    plan,
    attachment,
}: ExtractionContextProps) {
    return (
        <p className="fr-text--sm fr-m-0 extraction__context">
            <span>
                <span className="extraction__mention">Plan : </span>
                {plan.nom}
            </span>
            <span className="extraction__document">
                <span className="extraction__mention">Document : </span>
                <span
                    className={`${documentIconOf(attachment.name)} fr-icon--sm`}
                    aria-hidden="true"
                />
                {attachment.name}
            </span>
        </p>
    )
}
