import { useState } from 'react'
import type {
    ExtractedLineChanges,
    ExtractionSummary,
} from '@shared/core/application/ports/extracted-approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../referentiels'
import type { EditableFields } from '../approvisionnement-form'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import ScreenSelectPlan, { type SelectablePlan } from './ScreenSelectPlan'
import ScreenPlanApprovisionnement from './ScreenPlanApprovisionnement'
import ScreenImportFromDoc from './ScreenImportFromDoc'
import type { ExtractedDocument } from '@shared/core/application/services/extract-approvisionnement-from-document'
import { ExtractedLinesNotDeletedError } from '@shared/core/application/services/import-extracted-approvisionnements'
import type { ExtractedApprovisionnement } from '@shared/core/domain/entities/extracted-approvisionnement'

export type ScreenProps = Referentiels & {
    plans: readonly SelectablePlan[]
    approvisionnements: readonly Approvisionnement[]
    attachments: readonly Attachment[]
    pays: readonly Pays[]
    createApprovisionnements: (
        approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
    ) => Promise<Approvisionnement['id'][]>
    updateApprovisionnement: (
        id: Approvisionnement['id'],
        approvisionnement: Partial<Approvisionnement>
    ) => Promise<void>
    deleteApprovisionnement: (id: Approvisionnement['id']) => Promise<void>
    createEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    createPays: (pays: Pays) => Promise<void>
    extractions: readonly ExtractionSummary[]
    listExtractions: () => Promise<readonly ExtractionSummary[]>
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
    approvisionnements: initialApprovisionnements,
    entreprises: initialEntreprises,
    pays: initialPays,
    createApprovisionnements,
    updateApprovisionnement,
    deleteApprovisionnement,
    createEntreprise,
    findEntrepriseBySiret,
    createPays,
    extractions: initialExtractions,
    listExtractions,
    getAttachmentUrl,
    extractDocument,
    deleteExtraction,
    updateExtractedApprovisionnement,
    importExtractedApprovisionnements,
    ...data
}: ScreenProps) {
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    const [picking, setPicking] = useState(false)
    const [approvisionnements, setApprovisionnements] = useState(
        initialApprovisionnements
    )
    const [entreprises, setEntreprises] = useState(initialEntreprises)
    const [pays, setPays] = useState(initialPays)
    const [importing, setImporting] = useState<
        { resumedId?: Attachment['id'] } | false
    >(false)
    const [notice, setNotice] = useState<string | null>(null)
    const [extractions, setExtractions] = useState(initialExtractions)

    const plan = plans.find(({ id }) => id === planId)

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setPicking(false)
        setImporting(false)
    }

    function refreshExtractions() {
        listExtractions().then(setExtractions, () => {})
    }

    async function create(
        planDApprovisionnement: SelectablePlan['id'],
        fields: EditableFields
    ) {
        const approvisionnement = { planDApprovisionnement, ...fields }
        const [id] = await createApprovisionnements([approvisionnement])
        setApprovisionnements((previous) => [
            ...previous,
            { ...approvisionnement, id },
        ])
    }

    async function importLines(
        lines: readonly ExtractedApprovisionnement[],
        plan: Approvisionnement['planDApprovisionnement'],
        source: Attachment['id']
    ) {
        const add = (created: readonly Approvisionnement[]) =>
            setApprovisionnements((previous) => [...previous, ...created])

        try {
            const created = await importExtractedApprovisionnements(
                lines,
                plan,
                source
            )
            add(created)

            return created
        } catch (error) {
            if (error instanceof ExtractedLinesNotDeletedError)
                add(error.created)

            throw error
        }
    }

    async function addEntreprise(entreprise: Entreprise) {
        await createEntreprise(entreprise)
        setEntreprises((previous) => [...previous, entreprise])
    }

    async function addPays(created: Pays) {
        await createPays(created)
        setPays((previous) => [...previous, created])
    }

    async function update(
        id: Approvisionnement['id'],
        changes: Partial<Approvisionnement>
    ) {
        await updateApprovisionnement(id, changes)
        setApprovisionnements((previous) =>
            previous.map((approvisionnement) =>
                approvisionnement.id === id
                    ? { ...approvisionnement, ...changes }
                    : approvisionnement
            )
        )
    }

    async function remove(id: Approvisionnement['id']) {
        await deleteApprovisionnement(id)
        setApprovisionnements((previous) =>
            previous.filter((approvisionnement) => approvisionnement.id !== id)
        )
    }

    if (!plan || picking)
        return (
            <ScreenSelectPlan
                plans={plans}
                current={plan}
                onSelect={selectPlan}
                onCancel={() => setPicking(false)}
            />
        )

    if (importing)
        return (
            <ScreenImportFromDoc
                plan={plan}
                attachments={data.attachments.filter(
                    ({ planDApprovisionnement }) =>
                        planDApprovisionnement === plan.id
                )}
                extractions={
                    new Map(
                        extractions.map((summary) => [
                            summary.attachmentId,
                            summary,
                        ])
                    )
                }
                getAttachmentUrl={getAttachmentUrl}
                extractDocument={extractDocument}
                deleteExtraction={deleteExtraction}
                updateExtractedApprovisionnement={
                    updateExtractedApprovisionnement
                }
                entreprises={entreprises}
                ressources={data.ressources}
                departementsByRegion={data.departementsByRegion}
                pays={pays}
                onCreateEntreprise={addEntreprise}
                findEntrepriseBySiret={findEntrepriseBySiret}
                onCreatePays={addPays}
                importExtractedApprovisionnements={(lines, source) =>
                    importLines(lines, plan.id, source)
                }
                onExtractionsChanged={refreshExtractions}
                onImported={(imported) => {
                    setNotice(imported)
                    setImporting(false)
                }}
                onBack={() => setImporting(false)}
                resumedId={importing.resumedId}
            />
        )

    return (
        <ScreenPlanApprovisionnement
            key={plan.id}
            plan={plan}
            approvisionnements={approvisionnements}
            entreprises={entreprises}
            pays={pays}
            onChangePlan={() => setPicking(true)}
            onCreate={(fields) => create(plan.id, fields)}
            onUpdate={update}
            onDelete={remove}
            onCreateEntreprise={addEntreprise}
            findEntrepriseBySiret={findEntrepriseBySiret}
            onCreatePays={addPays}
            notice={notice}
            extractions={extractions}
            onImportFromDocument={() => {
                setNotice(null)
                setImporting({})
            }}
            onResumeExtraction={(resumedId) => {
                setNotice(null)
                setImporting({ resumedId })
            }}
            {...data}
        />
    )
}
