import type { Departement } from '@shared/core/domain/value-objects/departement'
import type { UsageType } from '@shared/core/domain/value-objects/usage'

export type PlanDApprovisionnement = {
    id: number
    nom: string
    /**
     * Ref to the document's `Installation` table — the identifier the document
     * knows the plan's site by. The installation itself is never read: what any
     * screen wanted from it was the département, and the plan carries that.
     */
    installation: number
    /**
     * The département the plan sits in, computed by the document from the
     * commune of its installation. Null when the document places it nowhere.
     */
    departement: Departement['dep'] | null
    typeDePlan: string
    usage: UsageType | null
    natureDonnee: string
    statut: string
}
