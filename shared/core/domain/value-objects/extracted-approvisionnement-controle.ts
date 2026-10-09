export const NON_VERIFIEE = 'Non vérifiée' as const
export const VERIFIEE = 'Vérifiée' as const

export const CONTROLES = [NON_VERIFIEE, VERIFIEE] as const

export type Controle = (typeof CONTROLES)[number]
