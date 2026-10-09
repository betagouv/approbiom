import type { Ports } from '../ports'
import { FAKE_PLANS } from './plans'
import { FAKE_DEMANDES_SUBVENTION } from './demandes-subvention'
import { FAKE_PROGRAMMES_AIDE } from './programmes-aide'
import { createFakeApprovisionnementPort } from './approvisionnements'
import { FAKE_ATTACHMENTS } from './attachments'
import { FAKE_ENTREPRISES } from './entreprises'
import { FAKE_ENTREPRISE_SEARCH } from './entreprise-search'
import { FAKE_RESSOURCES } from './ressources'
import { FAKE_DEPARTEMENTS_BY_REGION } from './departements'
import { createFakeExtractedApprovisionnements } from './extracted-approvisionnements'
import { fakeExtractDataFromDocument } from './extract-data'

// An empty file: the fake extraction only looks at the document's name.
const EMPTY_FILE_URL = 'data:,'

// What the widget runs on outside Grist.
export const FAKE_PORTS: Ports = {
    plans: { list: () => Promise.resolve(FAKE_PLANS) },
    demandesSubvention: {
        list: () => Promise.resolve(FAKE_DEMANDES_SUBVENTION),
    },
    programmesAide: {
        list: () => Promise.resolve(FAKE_PROGRAMMES_AIDE),
        update: () => Promise.reject(new Error('Fake data is read-only.')),
    },
    approvisionnements: createFakeApprovisionnementPort(),
    attachments: {
        list: () => Promise.resolve(FAKE_ATTACHMENTS),
        getFileUrl: () => Promise.resolve(EMPTY_FILE_URL),
        download: () => Promise.resolve(new Blob()),
    },
    entreprises: {
        list: () => Promise.resolve(FAKE_ENTREPRISES),
        create: () => Promise.resolve(),
    },
    entrepriseSearch: FAKE_ENTREPRISE_SEARCH,
    ressources: { list: () => Promise.resolve(FAKE_RESSOURCES) },
    referentielGeo: {
        listDepartementsByRegion: () =>
            Promise.resolve(FAKE_DEPARTEMENTS_BY_REGION),
    },
    extractedApprovisionnements: createFakeExtractedApprovisionnements(),
    documentExtractorApprovisionnement: {
        extract: fakeExtractDataFromDocument,
    },
}
