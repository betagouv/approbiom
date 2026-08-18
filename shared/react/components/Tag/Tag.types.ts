import type { ReactNode } from 'react'

export type TagProps = {
    children: ReactNode
    // One of DSFR's illustrative colours, by name — « green-emeraude »,
    // « pink-tuile »… The component turns it into the class. Left out for the
    // neutral grey tag, which is DSFR's own default.
    //
    // Every colour has to have a rule in Tag.css: one that does not is a tag
    // that comes out grey without saying why.
    color?: string
    // DSFR ships two sizes and `md` is the one it falls back to, so that is the
    // default here too.
    size?: 'sm' | 'md'
}
