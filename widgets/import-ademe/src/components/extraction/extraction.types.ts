import type { ReadLineWithProvenanceParseResults } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type ExtractionStatus =
    | { status: 'loading' }
    | {
          status: 'success'
          lines: readonly ReadLineWithProvenanceParseResults[]
          date: Date
      }
    | { status: 'error'; message: string }
