import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'
import type { Ressource } from '@shared/core/domain/entities/ressource'

export type MatchReferences = {
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
}

export interface DocumentExtractorApprovisionnementPort {
    extract(
        file: Blob,
        document: Attachment['name'],
        references: MatchReferences
    ): Promise<ExtractedLine[]>
}
