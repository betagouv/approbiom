import type { Ports } from '../ports'
import { FAKE_PLANS } from './plans'
import { FAKE_DEMANDES_SUBVENTION } from './demandes-subvention'
import { FAKE_PROGRAMMES_AIDE } from './programmes-aide'
import { createFakeApprovisionnementPort } from './approvisionnements'
import { FAKE_ATTACHMENTS } from './attachments'
import { FAKE_ENTREPRISES } from './entreprises'
import { FAKE_RESSOURCES } from './ressources'
import { FAKE_DEPARTEMENTS_BY_REGION } from './departements'

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
    attachments: { list: () => Promise.resolve(FAKE_ATTACHMENTS) },
    entreprises: { list: () => Promise.resolve(FAKE_ENTREPRISES) },
    ressources: { list: () => Promise.resolve(FAKE_RESSOURCES) },
    referentielGeo: {
        listDepartementsByRegion: () =>
            Promise.resolve(FAKE_DEPARTEMENTS_BY_REGION),
    },
}
