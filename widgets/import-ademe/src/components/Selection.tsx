import { useState } from 'react'
import SearchBar from '@shared/react/components/SearchBar'
import Badge from '@shared/react/components/Badge'
import Tag from '@shared/react/components/Tag'
import type { PlanView } from '@shared/core/application/services/plan-view'
import type { Attachment } from '@shared/core/domain/entities/attachment'
import AttachmentPicker from './AttachmentPicker'
export type SelectablePlan = Pick<
    PlanView,
    'id' | 'nom' | 'typeDePlan' | 'statut' | 'appelsAProjet'
>

const UNKNOWN = 'Inconnu'

export type SelectionProps = {
    plans: readonly SelectablePlan[]
    attachments: readonly Attachment[]
}

export default function Selection({ plans, attachments }: SelectionProps) {
    const [planId, setPlanId] = useState<SelectablePlan['id'] | null>(null)
    const [attachmentId, setAttachmentId] = useState<Attachment['id'] | null>(
        null
    )
    const plan = plans.find(({ id }) => id === planId)
    const planAttachments = attachments.filter(
        ({ planDApprovisionnement }) => planDApprovisionnement === planId
    )

    function selectPlan(id: SelectablePlan['id']) {
        setPlanId(id)
        setAttachmentId(null)
    }

    const options = plans.map(({ id, nom }) => ({
        value: id,
        label: nom,
    }))

    return (
        <div className="plan-selection">
            <div className="plan-selection__search">
                <SearchBar
                    label="Plan d'approvisionnement"
                    showLabel
                    hint="Recherche sur le nom du plan"
                    placeholder="Ex. chaufferie Tulle"
                    options={options}
                    onSelect={selectPlan}
                />
            </div>

            {plan && (
                <dl className="plan-summary">
                    <div className="plan-summary__entry">
                        <dt className="fr-text--xs">Nom</dt>
                        <dd className="fr-text--sm plan-summary__name">
                            {plan.nom}
                        </dd>
                    </div>
                    <div className="plan-summary__entry">
                        <dt className="fr-text--xs">Type de plan</dt>
                        <dd>
                            <Badge size="sm">{plan.typeDePlan}</Badge>
                        </dd>
                    </div>
                    <div className="plan-summary__entry">
                        <dt className="fr-text--xs">Appel à projet</dt>
                        <dd>
                            <Badge size="sm">
                                {plan.appelsAProjet.join(', ') || UNKNOWN}
                            </Badge>
                        </dd>
                    </div>
                    <div className="plan-summary__entry">
                        <dt className="fr-text--xs">Statut</dt>
                        <dd>
                            <Tag size="sm">{plan.statut}</Tag>
                        </dd>
                    </div>
                </dl>
            )}

            {plan && (
                <AttachmentPicker
                    attachments={planAttachments}
                    selectedId={attachmentId}
                    onSelect={setAttachmentId}
                />
            )}

            {!plan && (
                <div className="plan-selection__empty">
                    <p className="fr-text--sm fr-m-0">
                        Choisissez un plan pour afficher ses pièces jointes.
                    </p>
                </div>
            )}
        </div>
    )
}
