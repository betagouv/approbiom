export type Ressource = {
    /** Created by the Approbiom team. */
    code: string
    /** ADEME 2017 referential, e.g. « 2017-2B-CIB »; empty when unlisted. */
    ademeCode: string
    title: string
    /** « Famille ressource » column, e.g. « 1 Bois coupé ». */
    famille: string
    description: string
}
