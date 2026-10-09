import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'
import type { Referentiels } from './referentiels'

export type ApprovisionnementRow = {
    id: Approvisionnement['id']
    fournisseur: string | null
    ressource: string
    provenance: string
    tonnage: number
    duplicate: string | null
}

const provenanceKey = (provenance: Provenance) =>
    provenance.source === PAYS_ETRANGER
        ? `${provenance.source}|${provenance.libelle}`
        : `${provenance.source}|${provenance.code}`

const duplicateKey = ({
    fournisseur,
    ressource,
    provenance,
}: Approvisionnement) =>
    `${fournisseur ?? ''}|${ressource}|${provenanceKey(provenance)}`

function letterOf(index: number): string {
    const letter = String.fromCharCode(65 + (index % 26))

    return index < 26 ? letter : letterOf(Math.floor(index / 26) - 1) + letter
}

const compare = (a: string, b: string) =>
    a.localeCompare(b, 'fr', { numeric: true })

export function toApprovisionnementRows(
    approvisionnements: readonly Approvisionnement[],
    { entreprises, ressources, departementsByRegion }: Referentiels
): ApprovisionnementRow[] {
    const denominations = new Map(
        entreprises.map(({ siret, denomination }) => [siret, denomination])
    )
    const ressourceLabels = new Map(
        ressources.map(({ code, title }) => [code, `${code} · ${title}`])
    )
    const departementLabels = new Map(
        departementsByRegion.flatMap(({ departements }) =>
            departements.map(({ dep, libelle }) => [dep, `${libelle} (${dep})`])
        )
    )

    const counts = new Map<string, number>()
    for (const approvisionnement of approvisionnements) {
        const key = duplicateKey(approvisionnement)
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const rows = approvisionnements
        .map((approvisionnement) => {
            const { id, fournisseur, ressource, provenance, tonnageTotal } =
                approvisionnement

            return {
                key: duplicateKey(approvisionnement),
                row: {
                    id,
                    fournisseur:
                        fournisseur === undefined
                            ? null
                            : (denominations.get(fournisseur) ?? fournisseur),
                    ressource: ressourceLabels.get(ressource) ?? ressource,
                    provenance:
                        provenance.source === PAYS_ETRANGER
                            ? provenance.libelle
                            : (departementLabels.get(provenance.code) ??
                              provenance.code),
                    tonnage: tonnageTotal,
                    duplicate: null as string | null,
                },
            }
        })
        .sort(
            (a, b) =>
                compare(a.row.ressource, b.row.ressource) ||
                compare(a.row.provenance, b.row.provenance) ||
                compare(a.row.fournisseur ?? '', b.row.fournisseur ?? '')
        )

    const letters = new Map<string, string>()
    for (const { key, row } of rows) {
        if ((counts.get(key) ?? 0) < 2) continue
        if (!letters.has(key)) letters.set(key, letterOf(letters.size))
        row.duplicate = letters.get(key) ?? null
    }

    return rows.map(({ row }) => row)
}
