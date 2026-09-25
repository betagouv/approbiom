import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import { FAKE_ATTACHMENTS } from './attachments'
import { FAKE_DEMANDES_SUBVENTION } from './demandes-subvention'
import { FAKE_PLANS } from './plans'
import { FAKE_PROGRAMMES_AIDE } from './programmes-aide'

// The ports the widget reads through, answered from the fake data.
export const FAKE_PORTS: PlanViewPorts & { attachments: AttachmentPort } = {
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
        getFileUrl: () => Promise.reject(new Error('Fake files have no URL.')),
        findOne: (id) => {
            const attachment = FAKE_ATTACHMENTS.find((file) => file.id === id)

            return attachment
                ? Promise.resolve(attachment)
                : Promise.reject(new Error(`No fake attachment ${id}.`))
        },
    },
}
