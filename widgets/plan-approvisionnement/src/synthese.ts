import type { ApprovisionnementRow } from './approvisionnement-rows'

// What a provenance or a fournisseur weighs in the plan's tonnage.
export type Share = {
    // Null for the fournisseur the plan does not give.
    label: string | null
    tonnage: number
    // Between 0 and 100.
    percentage: number
}

export type Synthese = {
    total: number
    byProvenance: Share[]
    byFournisseur: Share[]
}

function sharesBy(
    rows: readonly ApprovisionnementRow[],
    labelOf: (row: ApprovisionnementRow) => string | null,
    total: number
): Share[] {
    const tonnages = new Map<string | null, number>()
    for (const row of rows) {
        const label = labelOf(row)
        tonnages.set(label, (tonnages.get(label) ?? 0) + row.tonnage)
    }

    return [...tonnages]
        .map(([label, tonnage]) => ({
            label,
            tonnage,
            // A plan whose tonnages are all zero weighs nothing anywhere.
            percentage: total === 0 ? 0 : (tonnage / total) * 100,
        }))
        .sort(
            (a, b) =>
                b.tonnage - a.tonnage ||
                (a.label ?? '').localeCompare(b.label ?? '', 'fr')
        )
}

// Heaviest first.
export function toSynthese(rows: readonly ApprovisionnementRow[]): Synthese {
    const total = rows.reduce((sum, { tonnage }) => sum + tonnage, 0)

    return {
        total,
        byProvenance: sharesBy(rows, ({ provenance }) => provenance, total),
        byFournisseur: sharesBy(rows, ({ fournisseur }) => fournisseur, total),
    }
}
