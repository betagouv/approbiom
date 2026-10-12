import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Referentiels } from '../referentiels'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import type { SelectablePlan } from './PlanHeader'
import ScreenImportFromDoc from './ScreenImportFromDoc'
import { usePlanData, type PlanDataSources } from './usePlanData'
import type { ExtractedDocument } from '@shared/core/application/services/extract-approvisionnement-from-document'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'

export type ScreenProps = Referentiels &
    PlanDataSources & {
        plans: readonly SelectablePlan[]
        listAttachments: (
            plan: Attachment['planDApprovisionnement']
        ) => Promise<readonly Attachment[]>
        findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
        getAttachmentUrl: (id: Attachment['id']) => Promise<string>
        extractDocument: (attachment: Attachment) => Promise<ExtractedDocument>
        deleteExtraction: (attachment: Attachment) => Promise<void>
        updateExtractedApprovisionnement: (
            line: ExtractedApprovisionnement,
            changes: ExtractedLineChanges
        ) => Promise<ExtractedApprovisionnement>
        importExtractedApprovisionnements: (
            lines: readonly ExtractedApprovisionnement[],
            plan: Approvisionnement['planDApprovisionnement'],
            source: Attachment['id']
        ) => Promise<Approvisionnement[]>
    }

export default function Screen({
    plans,
    listAttachments,
    ressources,
    departementsByRegion,
    findEntrepriseBySiret,
    getAttachmentUrl,
    extractDocument,
    deleteExtraction,
    updateExtractedApprovisionnement,
    importExtractedApprovisionnements,
    ...sources
}: ScreenProps) {
    const data = usePlanData(sources)

    return (
        <>
            <h1 className="fr-h5 fr-mb-0">
                Importer des approvisionnements depuis un document
            </h1>
            <ScreenImportFromDoc
                plans={plans}
                listAttachments={listAttachments}
                extractions={
                    new Map(
                        data.extractions.map((summary) => [
                            summary.attachmentId,
                            summary,
                        ])
                    )
                }
                imported={data.imported}
                getAttachmentUrl={getAttachmentUrl}
                extractDocument={extractDocument}
                deleteExtraction={deleteExtraction}
                updateExtractedApprovisionnement={
                    updateExtractedApprovisionnement
                }
                entreprises={data.entreprises}
                ressources={ressources}
                departementsByRegion={departementsByRegion}
                pays={data.pays}
                onCreateEntreprise={data.addEntreprise}
                findEntrepriseBySiret={findEntrepriseBySiret}
                onCreatePays={data.addPays}
                importExtractedApprovisionnements={
                    importExtractedApprovisionnements
                }
                onExtractionsChanged={data.refreshExtractions}
                onImported={data.refreshImported}
            />
        </>
    )
}
