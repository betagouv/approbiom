import type { ImportedLines } from '@shared/infrastructure/import-bcib-bciat/helpers'

const DEP = 'Département français' as const
const PAYS = 'Pays étranger' as const

// The lines of the mock-up, as importRows would hand them over.
export function fakeExtractedLines(document: string): ImportedLines[] {
    return [
        {
            document,
            excelRow: 17,
            supplier: 'SARL Bois Energie Corrèze',
            resource: 'Plaquettes forestières',
            tonnage: 3200,
            rawProvenance: '50% corrèze, 30% creuse, 20% haute-vienne',
            additionalData:
                'PCI: 2,8, Fournisseur certifié: oui, Taux PEFC: 70',
            provenance: [
                { source: DEP, provenance: '19', percentage: 50 },
                { source: DEP, provenance: '23', percentage: 30 },
                { source: DEP, provenance: '87', percentage: 20 },
            ],
            confidence: 'Explicite',
            unrecognized: [],
        },
        {
            document,
            excelRow: 18,
            supplier: 'ONF agence Limousin',
            resource: 'Plaquettes forestières',
            tonnage: 1800,
            rawProvenance: 'Corrèze et Creuse',
            additionalData:
                'PCI: 2,7, Fournisseur certifié: oui, Taux PEFC: 100',
            provenance: [
                { source: DEP, provenance: '19', percentage: 50 },
                { source: DEP, provenance: '23', percentage: 50 },
            ],
            confidence: 'Répartition égale',
            unrecognized: [],
        },
        {
            document,
            excelRow: 19,
            supplier: 'Scierie Lagarde',
            resource: 'Connexes de scierie',
            tonnage: 950,
            rawProvenance: '100% 19',
            additionalData: 'PCI: 2,5, Fournisseur certifié: non',
            provenance: [{ source: DEP, provenance: '19', percentage: 100 }],
            confidence: 'Explicite',
            unrecognized: [],
        },
        {
            document,
            excelRow: 20,
            supplier: 'Granulés du Centre',
            resource: 'granulés DIN+',
            tonnage: 600,
            rawProvenance: '60 % Allemagne, reste france',
            additionalData:
                'PCI: 4,6, Fournisseur certifié: oui, Taux PEFC: 50',
            provenance: [
                { source: PAYS, provenance: 'Allemagne', percentage: 60 },
            ],
            confidence: 'À vérifier',
            unrecognized: ['reste france'],
        },
        {
            document,
            excelRow: 21,
            supplier: 'Coopérative forestière CFBL',
            resource: 'Bois bûche',
            tonnage: 1200,
            rawProvenance: 'rayon 100 km autour du site',
            additionalData:
                'PCI: 3,1, Fournisseur certifié: oui, Taux PEFC: 80',
            provenance: [],
            confidence: 'Non résolu',
            unrecognized: ['rayon 100 km autour du site'],
        },
        {
            document,
            excelRow: 22,
            supplier: 'SAS Recyclage Bois 87',
            resource: 'Bois fin de vie cl. A',
            tonnage: 400,
            rawProvenance: '87 : 70%, 86 : 30%',
            additionalData: 'PCI: 3,4, Fournisseur certifié: non',
            provenance: [
                { source: DEP, provenance: '87', percentage: 70 },
                { source: DEP, provenance: '86', percentage: 30 },
            ],
            confidence: 'Explicite',
            unrecognized: [],
        },
        {
            document,
            excelRow: 23,
            supplier: 'Alliance Forêts Bois',
            resource: 'Plaquettes forestières',
            tonnage: 2100,
            rawProvenance: 'Massif central (15, 19, 63)',
            additionalData:
                'PCI: 2,8, Fournisseur certifié: oui, Taux PEFC: 90',
            provenance: [
                { source: DEP, provenance: '15', percentage: 33.3 },
                { source: DEP, provenance: '19', percentage: 33.3 },
                { source: DEP, provenance: '63', percentage: 33.4 },
            ],
            confidence: 'Répartition égale',
            unrecognized: [],
        },
        {
            document,
            excelRow: 24,
            supplier: 'Lagarde & fils',
            resource: 'Écorces',
            tonnage: 300,
            rawProvenance: 'Corrèze principalement, un peu Dordogne',
            additionalData: 'PCI: 2,2, Fournisseur certifié: non',
            provenance: [
                { source: DEP, provenance: '19', percentage: 50 },
                { source: DEP, provenance: '24', percentage: 50 },
            ],
            confidence: 'À vérifier',
            unrecognized: [],
        },
        {
            document,
            excelRow: 25,
            supplier: 'Bois Limousin SAS',
            resource: 'Plaquettes bocagères',
            tonnage: 500,
            rawProvenance: 'Haute-Vienne 80% Creuse 20%',
            additionalData: 'PCI: 2,6, Fournisseur certifié: non',
            provenance: [
                { source: DEP, provenance: '87', percentage: 80 },
                { source: DEP, provenance: '23', percentage: 20 },
            ],
            confidence: 'Explicite',
            unrecognized: [],
        },
        {
            document,
            excelRow: 26,
            supplier: 'Ets Dupuy',
            resource: 'Sciures',
            tonnage: 250,
            rawProvenance: 'Espagne',
            additionalData: 'PCI: 4,0, Fournisseur certifié: non',
            provenance: [
                { source: PAYS, provenance: 'Espagne', percentage: 100 },
            ],
            confidence: 'Explicite',
            unrecognized: [],
        },
    ]
}
