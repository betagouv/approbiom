import type { Entreprise } from '@shared/core/domain/entities/entreprise'

// Fictional entreprises: neither the names nor the SIRETs exist.
export const FAKE_ENTREPRISES: readonly Entreprise[] = [
    { denomination: 'BOIS FICTIF ENERGIE', siret: '00000000000001' },
    { denomination: 'COOPERATIVE FICTIVE DES FORETS', siret: '00000000000002' },
    { denomination: 'SCIERIE FICTIVE DU VALLON', siret: '00000000000003' },
    { denomination: 'GRANULES FICTIFS DU PLATEAU', siret: '00000000000004' },
    { denomination: 'EXEMPLE COOPERATIVE FORESTIERE', siret: '00000000000005' },
    { denomination: 'RECYCLAGE FICTIF 00', siret: '00000000000006' },
    { denomination: 'ALLIANCE FICTIVE BOIS', siret: '00000000000007' },
    { denomination: 'BOIS FICTIF DU SUD', siret: '00000000000008' },
    { denomination: 'NEGOCE IMAGINAIRE', siret: '00000000000009' },
]
