export type Utilisateur = {
    id: number
    email: string
    /**
     * Ticked for the people the service is for, and not for the accounts that
     * only run it: they are the ones whose use is tracked.
     */
    utilisateurApprobiom: boolean
}
