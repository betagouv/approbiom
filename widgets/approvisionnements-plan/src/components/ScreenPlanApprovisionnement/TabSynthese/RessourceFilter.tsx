import './RessourceFilter.css'
import '@gouvfr/dsfr/dist/component/link/link.main.min.css'
import '@gouvfr/dsfr/dist/component/tag/tag.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useId } from 'react'
import DismissibleTag from '@shared/react/components/DismissibleTag'
import MultiSelect from '@shared/react/components/MultiSelect'
import SelectableTag from '@shared/react/components/SelectableTag'
import type { Ressource } from '@shared/core/domain/entities/ressource'

const MAX_SELECTABLE_TAGS = 6

export type RessourceFilterProps = {
    ressources: readonly Pick<Ressource, 'code' | 'title'>[]
    chosen: readonly Ressource['code'][]
    onChange: (chosen: Ressource['code'][]) => void
}

export default function RessourceFilter({
    ressources,
    chosen,
    onChange,
}: RessourceFilterProps) {
    const labelId = useId()

    const reset = chosen.length > 0 && (
        <button
            type="button"
            className="fr-link fr-link--sm fr-link--icon-left fr-icon-close-line"
            onClick={() => onChange([])}
        >
            Toutes les ressources
        </button>
    )

    if (ressources.length <= MAX_SELECTABLE_TAGS)
        return (
            <div className="ressource-filter">
                <span
                    id={labelId}
                    className="fr-text--sm fr-m-0 ressource-filter__label"
                >
                    Filtrer par ressource :
                </span>
                <div role="group" aria-labelledby={labelId}>
                    <ul className="fr-tags-group fr-tags-group--sm">
                        {ressources.map(({ code, title }) => (
                            <li key={code}>
                                <SelectableTag
                                    size="sm"
                                    pressed={chosen.includes(code)}
                                    onToggle={() =>
                                        onChange(
                                            chosen.includes(code)
                                                ? chosen.filter(
                                                      (other) => other !== code
                                                  )
                                                : [...chosen, code]
                                        )
                                    }
                                    title={title || undefined}
                                >
                                    {code}
                                </SelectableTag>
                            </li>
                        ))}
                    </ul>
                </div>
                {reset}
            </div>
        )

    return (
        <div className="ressource-filter ressource-filter--list">
            <div className="ressource-filter__select">
                <MultiSelect
                    label="Filtrer par ressource"
                    options={ressources.map(({ code, title }) => ({
                        value: code,
                        label: title ? `${code} · ${title}` : code,
                    }))}
                    selectedValues={chosen}
                    onSelectionChange={onChange}
                />
            </div>
            {chosen.length > 0 && (
                <div className="ressource-filter">
                    <ul
                        className="fr-tags-group fr-tags-group--sm"
                        aria-label="Ressources retenues"
                    >
                        {chosen.map((code) => (
                            <li key={code}>
                                <DismissibleTag
                                    size="sm"
                                    dismissLabel={`Retirer le filtre ${code}`}
                                    onDismiss={() =>
                                        onChange(
                                            chosen.filter(
                                                (other) => other !== code
                                            )
                                        )
                                    }
                                >
                                    {code}
                                </DismissibleTag>
                            </li>
                        ))}
                    </ul>
                    {reset}
                </div>
            )}
        </div>
    )
}
