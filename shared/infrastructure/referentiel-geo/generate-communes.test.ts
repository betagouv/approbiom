import { describe, expect, it } from 'vitest'
import {
    buildCommunesFile,
    CENTRES_SOURCE,
    parseCsv,
    parseReferentiel,
    toCentres,
    type LigneReferentiel,
} from './generate-communes.ts'

// Fictitious communes throughout: the codes and names are made up, only the
// shapes are the ones the COG and geo.api.gouv.fr use.

const HEADER =
    'TYPECOM,COM,REG,DEP,CTCD,ARR,TNCC,NCC,NCCENR,LIBELLE,CAN,COMPARENT'

describe('parseCsv', () => {
    it('reads quoted fields holding commas, quotes and line breaks', () => {
        expect(parseCsv('a,"b, c","d ""e""","f\ng"\n')).toEqual([
            ['a', 'b, c', 'd "e"', 'f\ng'],
        ])
    })

    it('accepts CRLF line endings, a byte-order mark and no final line break', () => {
        expect(parseCsv('\uFEFFa,b\r\nc,d')).toEqual([
            ['a', 'b'],
            ['c', 'd'],
        ])
    })

    it('fails on a quote left open rather than swallowing the rows after it', () => {
        expect(() => parseCsv('a,"b\nc,d\n')).toThrow(/unterminated/)
    })

    it('keeps empty fields', () => {
        expect(parseCsv('a,,b,\n')).toEqual([['a', '', 'b', '']])
    })
})

describe('parseReferentiel', () => {
    it('reads the type, code and libellé of each commune', () => {
        const { lignes, ignorees } = parseReferentiel(
            [
                HEADER,
                'COM,99001,84,99,99D,991,0,VALBRUME,Valbrume,Valbrume,9901,',
                'COMD,99002,84,99,99D,991,0,ROCHEFAUX,Rochefaux,Rochefaux,,99001',
            ].join('\n')
        )

        expect(lignes).toEqual([
            { type: 'COM', code: '99001', libelle: 'Valbrume' },
            { type: 'COMD', code: '99002', libelle: 'Rochefaux' },
        ])
        expect(ignorees).toEqual([])
    })

    it('finds its columns by name, whatever their order', () => {
        const { lignes } = parseReferentiel(
            'LIBELLE,COM,TYPECOM\nValbrume,99001,COM\n'
        )

        expect(lignes).toEqual([
            { type: 'COM', code: '99001', libelle: 'Valbrume' },
        ])
    })

    it('reports, by line number, the rows that name no commune', () => {
        const { lignes, ignorees } = parseReferentiel(
            [
                HEADER,
                'COM,99001,84,99,99D,991,0,VALBRUME,Valbrume,Valbrume,9901,',
                ',,,,,,0,,,brouillon,,',
                'XYZ,99003,84,99,99D,991,0,X,X,X,,',
                'COM,99004,84,99,99D,991,0,,,,,',
                '',
            ].join('\n')
        )

        expect(lignes.map(({ code }) => code)).toEqual(['99001'])
        expect(ignorees).toEqual([3, 4, 5])
    })

    it('fails on a CSV that lacks a column it needs', () => {
        expect(() => parseReferentiel('TYPECOM,COM\nCOM,99001\n')).toThrow(
            /no LIBELLE column/
        )
    })

    it('fails on an empty CSV', () => {
        expect(() => parseReferentiel('')).toThrow(/empty/)
    })
})

describe('toCentres', () => {
    it('indexes each centre by type and code, as [latitude, longitude]', () => {
        const centres = toCentres([
            [
                {
                    code: '99001',
                    type: 'commune-actuelle',
                    centre: { type: 'Point', coordinates: [4.5, 45.1] },
                },
            ],
            [
                {
                    code: '99001',
                    type: 'commune-deleguee',
                    centre: { type: 'Point', coordinates: [4.6, 45.2] },
                },
            ],
        ])

        expect(centres.get('COM:99001')).toEqual({
            latitude: 45.1,
            longitude: 4.5,
        })
        expect(centres.get('COMD:99001')).toEqual({
            latitude: 45.2,
            longitude: 4.6,
        })
    })

    it('leaves out the entries it cannot use', () => {
        const centres = toCentres([
            [
                null,
                { code: '99001', type: 'commune-actuelle' },
                {
                    code: '99002',
                    type: 'commune-inconnue',
                    centre: { coordinates: [4.5, 45.1] },
                },
                {
                    code: '99003',
                    type: 'commune-actuelle',
                    centre: { coordinates: [Number.NaN, 45.1] },
                },
                {
                    code: '99004',
                    type: 'commune-actuelle',
                    centre: { coordinates: ['4.5', '45.1'] },
                },
            ],
        ])

        expect(centres.size).toBe(0)
    })

    it('fails on an answer that is not an array', () => {
        expect(() => toCentres([{ type: 'FeatureCollection' }])).toThrow(
            /array/
        )
    })
})

describe('buildCommunesFile', () => {
    const referentiel = {
        fichier: 'INSEE_Commune.csv',
        source: 'Grist, table INSEE_Commune',
    }
    const generatedAt = new Date('2026-01-02T03:04:05.000Z')

    function build(
        lignes: LigneReferentiel[],
        centres: Record<string, [number, number]>
    ) {
        return buildCommunesFile({
            lignes,
            centres: new Map(
                Object.entries(centres).map(([key, [latitude, longitude]]) => [
                    key,
                    { latitude, longitude },
                ])
            ),
            referentiel,
            generatedAt,
        })
    }

    it('names each commune with its libellé from the référentiel', () => {
        const { file, sansCentre } = build(
            [{ type: 'COM', code: '99001', libelle: "L'Île-Valbrume" }],
            { 'COM:99001': [45.1, 4.5] }
        )

        expect(file.communes).toEqual({
            '99001': { nom: "L'Île-Valbrume", latitude: 45.1, longitude: 4.5 },
        })
        expect(sansCentre).toEqual([])
    })

    it('matches a row with the centre of its own type only', () => {
        const ligne: LigneReferentiel = {
            type: 'COMA',
            code: '99001',
            libelle: 'Rochefaux',
        }

        const { file, sansCentre } = build([ligne], {
            'COM:99001': [45.1, 4.5],
        })

        expect(file.communes).toEqual({})
        expect(sansCentre).toEqual([ligne])
    })

    it('gives a shared code to the commune nouvelle rather than its commune déléguée', () => {
        const { file } = build(
            [
                { type: 'COMD', code: '99001', libelle: 'Valbrume-le-Bourg' },
                { type: 'COM', code: '99001', libelle: 'Valbrume' },
            ],
            { 'COMD:99001': [45.2, 4.6], 'COM:99001': [45.1, 4.5] }
        )

        expect(file.communes).toEqual({
            '99001': { nom: 'Valbrume', latitude: 45.1, longitude: 4.5 },
        })
    })

    it('falls back on the commune déléguée when the commune nouvelle has no centre', () => {
        const commune: LigneReferentiel = {
            type: 'COM',
            code: '99001',
            libelle: 'Valbrume',
        }

        const { file, sansCentre } = build(
            [
                commune,
                { type: 'COMD', code: '99001', libelle: 'Valbrume-le-Bourg' },
            ],
            { 'COMD:99001': [45.2, 4.6] }
        )

        expect(file.communes['99001']?.nom).toBe('Valbrume-le-Bourg')
        expect(sansCentre).toEqual([commune])
    })

    it('sorts the communes by code', () => {
        const { file } = build(
            [
                { type: 'COM', code: '2B001', libelle: 'C' },
                { type: 'COM', code: '01001', libelle: 'A' },
                { type: 'COM', code: '2A001', libelle: 'B' },
            ],
            {
                'COM:2B001': [42, 9],
                'COM:01001': [46, 5],
                'COM:2A001': [41, 9],
            }
        )

        expect(Object.keys(file.communes)).toEqual(['01001', '2A001', '2B001'])
    })

    it('says when and from what the file was generated', () => {
        const { file } = build([], {})

        expect(file._metadata).toEqual({
            _comment:
                'Généré le 2026-01-02T03:04:05.000Z par `pnpm generate:referentiels communes` ' +
                'à partir du référentiel INSEE_Commune.csv (source : Grist, table INSEE_Commune). ' +
                `Centres des communes : ${CENTRES_SOURCE}`,
            generatedAt: '2026-01-02T03:04:05.000Z',
            referentiel,
            centresSource: CENTRES_SOURCE,
        })
        // First, so it is what anyone opening the file reads.
        expect(Object.keys(file)[0]).toBe('_metadata')
    })
})
