import type { Approvisionnement } from '../entities/approvisionnement'

export const isValidTonnage = (
    tonnage: Approvisionnement['tonnageTotal']
): boolean => Number.isFinite(tonnage) && tonnage >= 0
