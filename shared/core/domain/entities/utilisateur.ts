export type Utilisateur = {
    id: number
    email: string
    /** False for the accounts that only run the service: their use is not tracked. */
    utilisateurApprobiom: boolean
}
