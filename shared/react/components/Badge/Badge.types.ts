import type { ReactNode } from 'react'

export type BadgeStatus = 'success' | 'error' | 'warning' | 'info' | 'new'

type BadgeBase = {
    // Must state the status on its own: colour and icon only repeat it. Keep
    // it short: DSFR uppercases the badge and never wraps it.
    children: ReactNode
    // Defaults to `md`.
    size?: 'sm' | 'md'
}

// Status and color are exclusive: both DSFR class families set the same
// properties, so mixing them gives the colour of one and the icon of the other.
export type BadgeProps = BadgeBase &
    (
        | {
              status: BadgeStatus
              color?: never
              // Drops the status icon, keeping its colours.
              noIcon?: boolean
          }
        | {
              // A DSFR illustrative colour name (« green-emeraude »…); an unknown
              // name comes out grey. Omit for the neutral grey badge.
              color?: string
              status?: never
              noIcon?: never
          }
    )
