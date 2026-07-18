import Button from '@shared/components/Button'
import GristWrapper from '@shared/components/GristWrapper'
import './App.css'
import { useEffect, useState } from 'react'

const REQUIRED_ACCESS = 'full'
const TABLE_ID = 'Plan_d_approvisionnement'

// fetchTable returns column-major data: {id: [1, 2], colA: [...], colB: [...]}.
type TableColValues = Record<string, unknown[]>

type Row = Record<string, unknown>

function toRows(data: TableColValues): Row[] {
    const colIds = Object.keys(data)
    return (data.id ?? []).map((_, index) =>
        Object.fromEntries(colIds.map((colId) => [colId, data[colId][index]]))
    )
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }
    // References, choice lists and dates are encoded as arrays by Grist.
    return JSON.stringify(value)
}

/**
 * Rendered inside <GristWrapper>, so Grist is guaranteed to be ready by the
 * time this mounts and the fetch below can run straight away.
 */
function CocoTable() {
    const [rows, setRows] = useState<Row[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        grist.docApi
            .fetchTable(TABLE_ID)
            .then((data: TableColValues) => setRows(toRows(data)))
            .catch((err: unknown) => setError(String(err)))
    }, [])

    if (error !== null) {
        return (
            <p>
                Impossible de lire la table « {TABLE_ID} » : {error}
            </p>
        )
    }

    if (rows === null) {
        return <p>Chargement des données…</p>
    }

    if (rows.length === 0) {
        return <p>Cette table est vide.</p>
    }

    const colIds = Object.keys(rows[0])

    return (
        <table className="data-table">
            <thead>
                <tr>
                    {colIds.map((colId) => (
                        <th key={colId}>{colId}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={String(row.id)}>
                        {colIds.map((colId) => (
                            <td key={colId}>{formatCell(row[colId])}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default function App() {
    return (
        <main className="app">
            <h1>Table {TABLE_ID}</h1>
            <GristWrapper requiredAccess={REQUIRED_ACCESS}>
                <CocoTable />
            </GristWrapper>
            <Button onClick={() => alert('Widget A')}>Bouton partagé</Button>
        </main>
    )
}
