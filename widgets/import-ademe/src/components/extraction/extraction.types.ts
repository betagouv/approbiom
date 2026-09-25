import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type ExtractionStatus =
    | { status: 'loading' }
    | { status: 'success'; lines: readonly ImportedLines[]; date: Date }
    | { status: 'error'; message: string }
