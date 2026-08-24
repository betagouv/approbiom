import type { InseePort } from '@shared/core/application/ports/insee'
import type { Commune } from '@shared/core/domain/value-objects/commune'
import dataset from './communes.json'

type CommunesDataset = {
    communes: Record<Commune['codeInsee'], CommuneRecord | undefined>
}

type CommuneRecord = {
    nom: Commune['nom']
    latitude: number
    longitude: number
}

const { communes } = dataset as CommunesDataset

export function createInseeCommuneAdapter(): Pick<
    InseePort,
    'getCommuneCenterPosition'
> {
    return {
        getCommuneCenterPosition(codeCommune) {
            const commune = communes[codeCommune]
            if (commune === undefined) {
                throw new Error(
                    `no commune carries the INSEE code "${codeCommune}"`
                )
            }

            return {
                latitude: commune.latitude,
                longitude: commune.longitude,
            }
        },
    }
}
