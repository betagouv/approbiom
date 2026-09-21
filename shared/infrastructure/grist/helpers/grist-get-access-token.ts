import type { AccessTokenResult } from 'grist/GristAPI'
import { gristReady } from './grist-ready'

export async function getAccessToken(): Promise<AccessTokenResult> {
    await gristReady()

    return grist.docApi.getAccessToken({ readOnly: true })
}
