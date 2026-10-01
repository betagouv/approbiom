import '@gouvfr/dsfr/dist/component/accordion/accordion.main.min.css'
import { useId, useState, type ReactNode } from 'react'

interface AccordionProps {
    title: string
    children: ReactNode
}

/** The DSFR script is not loaded, so opening the accordion is handled here. */
export default function Accordion({ title, children }: AccordionProps) {
    const contentId = useId()
    const [expanded, setExpanded] = useState(false)

    return (
        <section className="fr-accordion fr-mb-2w">
            <h3 className="fr-accordion__title">
                <button
                    className="fr-accordion__btn"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={contentId}
                    onClick={() => setExpanded(!expanded)}
                >
                    {title}
                </button>
            </h3>
            <div
                className={`fr-collapse${expanded ? ' fr-collapse--expanded' : ''}`}
                id={contentId}
            >
                {children}
            </div>
        </section>
    )
}
