import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { ApprovisionnementPort } from '@shared/core/application/ports/approvisionnement'
import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { ReferentielGeoPort } from '@shared/core/application/ports/referentiel-geo'
import { FAKE_DEPARTEMENTS_BY_REGION } from './departements'
import type { EntreprisePort } from '@shared/core/application/ports/entreprise'
import type { RessourcePort } from '@shared/core/application/ports/ressource'
import type { importRows } from '@shared/infrastructure/import-bcib-bciat/importRows'
import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import { FAKE_ATTACHMENTS } from './attachments'
import { FAKE_DEMANDES_SUBVENTION } from './demandes-subvention'
import { fakeExtractDataFromDocument } from './extract-data'
import { FAKE_PLANS } from './plans'
import { FAKE_PROGRAMMES_AIDE } from './programmes-aide'
import { FAKE_ENTREPRISES } from './entreprises'
import { FAKE_RESSOURCES } from './ressources'
import { createFakeExtractedApprovisionnements } from './extracted-approvisionnements'
import type { ExtractedApprovisionnementPort } from '../extracted-approvisionnement-port'
import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'
import { FAKE_ENTREPRISE_SEARCH } from './entreprise-search'

// The ports the widget reads through, answered from the fake data.
// An empty file: the fake extraction only looks at the document's name.
const EMPTY_FILE_URL = 'data:,'

let egletonsDownloads = 0

const createdApprovisionnements: Approvisionnement[] = []

const entreprises = [...FAKE_ENTREPRISES]

const paysDeProvenance: Pays[] = [
    { libelle: 'Espagne' },
    { libelle: 'Italie' },
    { libelle: 'Allemagne' },
]

export const FAKE_PORTS: PlanViewPorts & {
    attachments: AttachmentPort
    entreprises: EntreprisePort
    ressources: RessourcePort
    extractDataFromDocument: typeof importRows
    extractedApprovisionnements: ExtractedApprovisionnementPort
    approvisionnements: ApprovisionnementPort
    referentielGeo: Pick<ReferentielGeoPort, 'listDepartementsByRegion'>
    entrepriseSearch: EntrepriseSearchPort
} = {
    plans: { list: () => Promise.resolve(FAKE_PLANS) },
    demandesSubvention: {
        list: () => Promise.resolve(FAKE_DEMANDES_SUBVENTION),
    },
    programmesAide: {
        list: () => Promise.resolve(FAKE_PROGRAMMES_AIDE),
        update: () => Promise.reject(new Error('Fake data is read-only.')),
    },
    attachments: {
        list: () => Promise.resolve(FAKE_ATTACHMENTS),
        // Égletons fails to download once, then works.
        getFileUrl: (id) =>
            id === 501 && egletonsDownloads++ === 0
                ? Promise.reject(
                      new Error(
                          'le téléchargement du fichier a échoué (503 Service Unavailable)'
                      )
                  )
                : Promise.resolve(EMPTY_FILE_URL),
        findOne: (id) => {
            const attachment = FAKE_ATTACHMENTS.find((file) => file.id === id)

            return attachment
                ? Promise.resolve(attachment)
                : Promise.reject(new Error(`No fake attachment ${id}.`))
        },
    },
    entreprises: {
        list: () => Promise.resolve([...entreprises]),
        create: (entreprise) => {
            entreprises.push(entreprise)
            return Promise.resolve()
        },
    },
    ressources: { list: () => Promise.resolve(FAKE_RESSOURCES) },
    extractDataFromDocument: fakeExtractDataFromDocument,
    extractedApprovisionnements: createFakeExtractedApprovisionnements(
        ({ derived }) =>
            createdApprovisionnements.some(
                ({ fournisseur, ressource }) =>
                    fournisseur === derived.matchedFournisseur?.siret &&
                    ressource === derived.matchedRessource?.code
            )
    ),
    approvisionnements: {
        list: () => Promise.resolve(createdApprovisionnements),
        create: (approvisionnements) => {
            const created = approvisionnements.map(
                (approvisionnement, index) => ({
                    ...approvisionnement,
                    id: createdApprovisionnements.length + index + 1,
                })
            )
            createdApprovisionnements.push(...created)
            return Promise.resolve(created.map(({ id }) => id))
        },
        update: () =>
            Promise.reject(
                new Error('This widget changes no approvisionnement.')
            ),
        delete: () =>
            Promise.reject(
                new Error('This widget deletes no approvisionnement.')
            ),
        listPaysDeProvenance: () => Promise.resolve([...paysDeProvenance]),
        addPaysDeProvenance: (pays) => {
            paysDeProvenance.push(pays)
            return Promise.resolve()
        },
        listGroupedByPlanAndRessource: () => Promise.resolve([]),
        listGroupedByPlanRessourceAndRegionOuPays: () => Promise.resolve([]),
        listGroupedByPlanRessourceAndProvenance: () => Promise.resolve([]),
        listGroupedByPlanRessourceAndFournisseur: () => Promise.resolve([]),
    },
    referentielGeo: {
        listDepartementsByRegion: () =>
            Promise.resolve(FAKE_DEPARTEMENTS_BY_REGION),
    },
    entrepriseSearch: FAKE_ENTREPRISE_SEARCH,
}
