import type { AttachmentPort } from '@shared/core/application/ports/attachment'
import type { importRows } from '@shared/infrastructure/import-bcib-bciat/importRows'
import type { PlanViewPorts } from '@shared/core/application/services/plan-view'
import { FAKE_ATTACHMENTS } from './attachments'
import { FAKE_DEMANDES_SUBVENTION } from './demandes-subvention'
import { fakeExtractDataFromDocument } from './extract-data'
import { FAKE_PLANS } from './plans'
import { FAKE_PROGRAMMES_AIDE } from './programmes-aide'

// The ports the widget reads through, answered from the fake data.
// An empty file: the fake extraction only looks at the document's name.
const EMPTY_FILE_URL = 'data:,'

let egletonsDownloads = 0

export const FAKE_PORTS: PlanViewPorts & {
    attachments: AttachmentPort
    extractDataFromDocument: typeof importRows
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
    extractDataFromDocument: fakeExtractDataFromDocument,
}
