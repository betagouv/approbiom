import { gristReady } from '@shared/infrastructure/grist/helpers/grist-ready'

export interface HistoryState {
    actionNum: number
    actionHash: string
    time?: Date
}

interface ActionHistoryResponse {
    records: {
        fields: {
            actionNum: number
            actionHash: string
            body: { data: number[] }
        }
    }[]
}

async function getDocAccess(): Promise<{ baseUrl: string; token: string }> {
    await gristReady()
    // A read-only token makes access rules treat us as a viewer, and Grist then refuses to expose the history.
    return grist.docApi.getAccessToken({ readOnly: false })
}

async function fetchJson(path: string, docId?: string): Promise<unknown> {
    const { baseUrl, token } = await getDocAccess()
    const docUrl = docId
        ? baseUrl.replace(
              /\/docs\/[^/]+$/,
              `/docs/${encodeURIComponent(docId)}`
          )
        : baseUrl
    const separator = path.includes('?') ? '&' : '?'
    const response = await fetch(`${docUrl}${path}${separator}auth=${token}`)
    if (!response.ok) {
        throw new Error(`${response.status} ${await response.text()}`)
    }
    return response.json()
}

/** Unlike the id in the page URL, which may be a shortened urlId. */
export async function getCurrentDocId(): Promise<string> {
    await gristReady()
    return grist.docApi.getDocName()
}

/**
 * The body is an ActionBundle in Grist's marshal format, where a string is
 * `u` + its byte length (int32 LE) + its bytes and a float is `g` + float64 LE.
 * Rather than decoding it all, we look for the first `time` key, which belongs
 * to the bundle's info and comes before the stored actions.
 */
function readActionTime(body: Uint8Array): Date | undefined {
    const key = [0x75, 4, 0, 0, 0, ...new TextEncoder().encode('time')]
    for (let i = 0; i <= body.length - key.length - 9; i++) {
        if (!key.every((byte, offset) => body[i + offset] === byte)) continue
        const valueStart = i + key.length
        if (body[valueStart] !== 0x67) return undefined
        const view = new DataView(
            body.buffer,
            body.byteOffset + valueStart + 1,
            8
        )
        return new Date(view.getFloat64(0, true))
    }
    return undefined
}

export async function listHistoryStates(): Promise<HistoryState[]> {
    const query =
        'select actionNum, actionHash, body from _gristsys_ActionHistory order by actionNum desc'
    const { records } = (await fetchJson(
        `/sql?${new URLSearchParams({ q: query })}`
    )) as ActionHistoryResponse
    return records.map(({ fields: { actionNum, actionHash, body } }) => ({
        actionNum,
        actionHash,
        time: readActionTime(new Uint8Array(body.data)),
    }))
}

export function compareStates(
    leftActionHash: string,
    rightActionHash: string
): Promise<unknown> {
    const params = new URLSearchParams({
        left: leftActionHash,
        right: rightActionHash,
    })
    return fetchJson(`/compare?${params}`)
}

/** Only details changes when both documents share part of their history. */
export function compareDocs(
    leftDocId: string,
    rightDocId: string
): Promise<unknown> {
    return fetchJson(
        `/compare/${encodeURIComponent(rightDocId)}?detail=true`,
        leftDocId
    )
}
