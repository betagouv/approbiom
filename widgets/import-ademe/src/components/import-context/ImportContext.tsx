import './ImportContext.css'

import type { ReactNode } from 'react'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import { documentIconOf } from '@shared/react/components/document-icon'
import type { SelectablePlan } from '../selection'

export type ImportContextProps = {
    plan: SelectablePlan
    attachment: Attachment
    // Shown at the end of the line, such as a status badge.
    children?: ReactNode
}

// Which plan and which document the step is about.
export default function ImportContext({
    plan,
    attachment,
    children,
}: ImportContextProps) {
    return (
        <div className="fr-text--sm fr-m-0 import-context">
            <span>
                <span className="import-context__mention">Plan : </span>
                {plan.nom}
            </span>
            <span className="import-context__document">
                <span className="import-context__mention">Document : </span>
                <span
                    className={`${documentIconOf(attachment.name)} fr-icon--sm`}
                    aria-hidden="true"
                />
                {attachment.name}
            </span>
            {children && (
                <span className="import-context__left">{children}</span>
            )}
        </div>
    )
}
