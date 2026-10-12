import type { Ressource } from '@shared/core/domain/entities/ressource'

export const FAKE_RESSOURCES: readonly Ressource[] = [
    {
        code: '1A-PFA',
        ademeCode: '2017-1A-PFA',
        title: 'Plaquettes forestières',
        description: 'Plaquettes forestières dont souches et rémanents',
    },
    {
        code: '1B-PFA',
        ademeCode: '2017-1B-PFA',
        title: 'Plaquettes bocagères',
        description: 'Plaquettes bocagères ou agroforestières',
    },
    {
        code: '2A-CIB',
        ademeCode: '2017-2A-CIB',
        title: 'Écorces',
        description: 'Ecorces',
    },
    {
        code: '2B-CIB',
        ademeCode: '2017-2B-CIB',
        title: 'Connexes de scierie',
        description: 'Produits connexes de scierie hors écorces',
    },
    {
        code: '4A-GR',
        ademeCode: '2017-4A-GR',
        title: 'Granulés de bois',
        description: 'Granulés de bois - pellets',
    },
    {
        code: '1D-BR',
        ademeCode: '',
        title: 'Bois bûche',
        description: 'Bois ronds forestier feuillu',
    },
]
