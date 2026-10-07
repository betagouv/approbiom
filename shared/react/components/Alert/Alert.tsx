// CSS lives next to its component: importing the DSFR alert stylesheet here
// means the styles follow the component into whichever widget uses it. The
// DSFR core stylesheet (variables, icon masks, typography) is a global layer
// and is imported once per widget entry point instead.
//
// `.main` rather than the all-in-one `.min.css`: the latter also bundles the
// legacy sheet, whose IE hacks (`min-width:0\0`) fail the lightningcss
// minifier at build time. Widgets run inside a modern-browser Grist iframe.
import '@gouvfr/dsfr/dist/component/alert/alert.main.min.css'
import type { ReactNode } from 'react'

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error'

export type AlertProps = {
    severity: AlertSeverity
    title?: string
    children: ReactNode
    size?: 'sm' | 'md'
}

export default function Alert({
    severity,
    title,
    children,
    size = 'md',
}: AlertProps) {
    const roleBySeverity = {
        info: 'status',
        success: 'status',
        warning: 'alert',
        error: 'alert',
    } satisfies Record<AlertSeverity, React.AriaRole>

    const role = roleBySeverity[severity]
    return (
        <div
            className={`fr-alert fr-alert--${severity}${size === 'sm' ? ' fr-alert--sm' : ''}`}
            role={role}
        >
            {title && size !== 'sm' && (
                <h3 className="fr-alert__title">{title}</h3>
            )}
            <p>{children}</p>
        </div>
    )
}
