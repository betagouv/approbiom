import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'

// Stands in for the Programme_d_aide table outside Grist.
export const FAKE_PROGRAMMES_AIDE: readonly ProgrammeAide[] = [
    {
        id: 1,
        year: 2023,
        name: 'Biomasse Chaleur Industrie Agriculture Tertiaire',
        shortName: 'BCIAT',
        appelAProjet: 'BCIAT (2023)',
        laureat: null,
    },
    {
        id: 2,
        year: 2023,
        name: 'Granulés',
        shortName: 'GRANULE',
        appelAProjet: 'GRANULE (2023)',
        laureat: null,
    },
    {
        id: 3,
        year: 2024,
        name: 'Biomasse Chaleur Industrie Bois',
        shortName: 'BCIB',
        appelAProjet: 'BCIB (2024)',
        laureat: null,
    },
]
