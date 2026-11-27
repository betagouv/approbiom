import type { ReactNode } from 'react'

export type TagProps = {
    children: ReactNode
    // A DSFR illustrative colour (« green-emeraude »…); each needs a rule in
    // Tag.css or it comes out grey.
    color?: string
    // Defaults to `md`.
    size?: 'sm' | 'md'
}
