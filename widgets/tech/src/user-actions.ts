import { gristReady } from '@shared/infrastructure/grist/helpers/grist-ready'

/** Accepts a single action, such as `["AddTable", ...]`, or a list of actions. */
export function parseUserActions(text: string): unknown[][] {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return [parsed]
    }
    if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((action) => Array.isArray(action))
    ) {
        return parsed as unknown[][]
    }
    throw new Error(
        'Attendu : une action, par exemple ["AddTable", ...], ou une liste d’actions.'
    )
}

export async function applyUserActions(actions: unknown[][]): Promise<unknown> {
    await gristReady()
    return grist.docApi.applyUserActions(actions)
}
