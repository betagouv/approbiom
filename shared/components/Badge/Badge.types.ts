import type { ReactNode } from 'react'

// The five statuses DSFR ships. Each one paints its own colours and brings its
// own icon — a filled check, a cross, a triangle, an « i », a flash for « new »
// — so the status is never carried by colour alone.
export type BadgeStatus = 'success' | 'error' | 'warning' | 'info' | 'new'

type BadgeBase = {
    // The state being reported, in the user's words. Keep it short: DSFR
    // uppercases the badge and never wraps it onto a second line.
    //
    // It has to say the state on its own. The colour and the icon repeat it,
    // they do not replace it — a badge whose text is « ✓ » says nothing to a
    // screen reader, and nothing to anyone who cannot tell the greens apart.
    children: ReactNode
    // DSFR ships two sizes and `md` is the one it falls back to, so that is the
    // default here too.
    size?: 'sm' | 'md'
}

// A badge says a status or it says a category, never both. They are two
// families of DSFR classes that set the same two properties, and an element
// given one of each comes out wearing the category's colours with the status's
// icon — a badge that reads as neither. The two shapes below make that
// combination a compile error rather than something to catch on screen.
export type BadgeProps = BadgeBase &
    (
        | {
              status: BadgeStatus
              color?: never
              // Drops the status icon, keeping its colours. DSFR's own escape
              // hatch for a run of badges where the icons are noise — in a
              // table column, say, where every row carries one.
              noIcon?: boolean
          }
        | {
              // One of DSFR's illustrative colours, by name — « green-emeraude
              // », « pink-tuile »… The component turns it into the class. Left
              // out for the neutral grey badge, which is DSFR's own default.
              //
              // `string` rather than the seventeen names: a colour that is not
              // one of them is not caught by the compiler, it comes out grey.
              // The same trade as `Tag`, and the same list of names — the two
              // components share DSFR's illustrative palette.
              color?: string
              status?: never
              // Only statuses carry an icon, so there is none to drop here.
              noIcon?: never
          }
    )
