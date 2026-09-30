import { useState } from 'react'
import { RadioGroup, type RadioOption } from '@shared/react/components/Radio'
import DocComparison from './DocComparison'
import StateComparison from './StateComparison'

type ComparisonKind = 'states' | 'documents'

const COMPARISON_KINDS: readonly RadioOption<ComparisonKind>[] = [
    { value: 'states', label: 'Deux états' },
    { value: 'documents', label: 'Deux documents' },
]

export default function Comparisons() {
    const [kind, setKind] = useState<ComparisonKind>('states')

    return (
        <>
            <RadioGroup
                legend="Comparer"
                options={COMPARISON_KINDS}
                value={kind}
                onChange={setKind}
                inline
            />
            {kind === 'states' && <StateComparison />}
            {kind === 'documents' && <DocComparison />}
        </>
    )
}
