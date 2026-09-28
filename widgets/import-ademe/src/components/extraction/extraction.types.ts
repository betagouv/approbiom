import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'

export type ExtractionStatus =
    | { status: 'loading' }
    | {
          status: 'success'
          lines: readonly ExtractedLine[]
          date: Date
      }
    | { status: 'error'; message: string }
