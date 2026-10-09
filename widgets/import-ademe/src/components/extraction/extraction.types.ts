import type { ExtractedLine } from '@shared/core/domain/entities/extracted-approvisionnement'

export type ExtractionStatus =
    | { status: 'loading' }
    | {
          status: 'success'
          lines: readonly ExtractedLine[]
          date: Date
      }
    | { status: 'error'; message: string }
