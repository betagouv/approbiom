export type Ressource = {
    /**
     * Code Approbiom: the ressource code created by the Approbiom team.
     */
    code: string
    /**
     * Code of the ressource in the ADEME 2017 referential, such as
     * « 2017-2B-CIB ». Empty for the ressources it does not list.
     */
    ademeCode: string
    title: string
    description: string
}
