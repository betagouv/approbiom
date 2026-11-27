import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import { listPlans } from '@shared/core/application/services/plan-view'
import { findEntrepriseBySiret } from '@shared/core/application/services/find-entreprise-by-siret'
import type { Ports } from './ports'

export async function loadApprovisionnementsSaisieManuelle(ports: Ports) {
    const [
        plans,
        approvisionnements,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
    ] = await Promise.all([
        listPlans(
            ['id', 'nom', 'typeDePlan', 'statut', 'appelsAProjet'],
            ports
        ),
        ports.approvisionnements.list(),
        ports.entreprises.list(),
        ports.ressources.list(['code', 'title']),
        ports.referentielGeo.listDepartementsByRegion(),
        ports.approvisionnements.listPaysDeProvenance(),
    ])

    return {
        plans,
        approvisionnements,
        entreprises,
        ressources,
        departementsByRegion,
        pays,
        listAttachments: (plan: Attachment['planDApprovisionnement']) =>
            ports.attachments.listByPlan(plan),
        createApprovisionnements: (
            approvisionnements: readonly Omit<Approvisionnement, 'id'>[]
        ) => ports.approvisionnements.create(approvisionnements),
        updateApprovisionnement: (
            id: Approvisionnement['id'],
            approvisionnement: Partial<Approvisionnement>
        ) => ports.approvisionnements.update(id, approvisionnement),
        deleteApprovisionnement: (id: Approvisionnement['id']) =>
            ports.approvisionnements.delete(id),
        createEntreprise: (entreprise: Entreprise) =>
            ports.entreprises.create(entreprise),
        findEntrepriseBySiret: (siret: string) =>
            findEntrepriseBySiret(siret, (query) =>
                ports.entrepriseSearch.getEntrepriseFromQuery(query)
            ),
    }
}
