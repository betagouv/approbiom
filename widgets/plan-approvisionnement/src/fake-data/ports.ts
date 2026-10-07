import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import { FAKE_PLANS } from './plans'
import { FAKE_DEMANDES_SUBVENTION } from './demandes-subvention'
import { FAKE_PROGRAMMES_AIDE } from './programmes-aide'

// What the widget runs on outside Grist.
export const FAKE_PORTS: PlanViewPorts = {
    plans: { list: () => Promise.resolve(FAKE_PLANS) },
    demandesSubvention: {
        list: () => Promise.resolve(FAKE_DEMANDES_SUBVENTION),
    },
    programmesAide: {
        list: () => Promise.resolve(FAKE_PROGRAMMES_AIDE),
        update: () => Promise.reject(new Error('Fake data is read-only.')),
    },
}
