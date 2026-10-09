import './ReviewModal.css'
import '@gouvfr/dsfr/dist/component/button/button.main.min.css'
import '@gouvfr/dsfr/dist/component/form/form.main.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.main.min.css'

import { useState } from 'react'
import Alert from '@shared/react/components/Alert'
import Modal from '@shared/react/components/Modal'
import Select from '@shared/react/components/Select'
import type { SiretLookup } from '@shared/core/application/services/find-entreprise-by-siret'
import type { ExtractedLineChanges } from '@shared/core/application/ports/extracted-approvisionnement'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Pays } from '@shared/core/domain/value-objects/pays'
import type { Referentiels } from '../../../../referentiels'
import FournisseurField from '../../../FournisseurField'
import ProvenanceEditor from '../ProvenanceEditor'
import {
    isVerifiable,
    type ExtractedApprovisionnement,
    type ExtractedLine,
} from '@shared/core/domain/entities/extracted-approvisionnement'

export type ReviewModalProps = Referentiels & {
    line: ExtractedApprovisionnement
    pays: readonly Pays[]
    onSave: (changes: ExtractedLineChanges) => Promise<void>
    onClose: () => void
    onCreateEntreprise: (entreprise: Entreprise) => Promise<void>
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
    onCreatePays: (pays: Pays) => Promise<void>
}

export default function ReviewModal({
    line,
    entreprises,
    ressources,
    departementsByRegion,
    pays,
    onSave,
    onClose,
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
}: ReviewModalProps) {
    const [draft, setDraft] = useState<ExtractedLine['derived']>(line.derived)
    const [changes, setChanges] = useState<ExtractedLineChanges>({})
    const [saving, setSaving] = useState(false)
    const [failed, setFailed] = useState(false)

    const { matchedFournisseur, matchedRessource, parsedProvenance } = draft

    function change(changed: Partial<ExtractedLine['derived']>) {
        setDraft((previous) => ({ ...previous, ...changed }))
        setChanges((previous) => ({ ...previous, ...changed }))
    }

    async function save() {
        if (Object.keys(changes).length === 0) return onClose()

        setSaving(true)
        setFailed(false)
        try {
            await onSave(changes)
            onClose()
        } catch {
            setFailed(true)
            setSaving(false)
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={`Données retenues dans la ligne ${line.read.excelRow}`}
            size="lg"
            actions={
                <div className="review-modal__actions">
                    {!isVerifiable({ read: line.read, derived: draft }) && (
                        <p className="fr-text--sm fr-m-0 review-modal__mention">
                            Pour pouvoir vérifier la ligne, choisissez une
                            ressource et au moins une provenance.
                        </p>
                    )}
                    <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                        <li>
                            <button
                                type="button"
                                className="fr-btn fr-icon-check-line"
                                disabled={saving}
                                onClick={() => void save()}
                            >
                                Modifier
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className="fr-btn fr-btn--secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </button>
                        </li>
                    </ul>
                </div>
            }
        >
            <div className="review-modal">
                {failed && (
                    <Alert severity="error" size="sm">
                        Les modifications n&apos;ont pas pu être enregistrées.
                        Réessayez.
                    </Alert>
                )}

                <div className="review-modal__section">
                    <div>
                        <FournisseurField
                            entreprises={entreprises}
                            value={matchedFournisseur?.siret}
                            onChange={(entreprise) =>
                                change({
                                    matchedFournisseur: entreprise ?? null,
                                })
                            }
                            onCreate={onCreateEntreprise}
                            findEntrepriseBySiret={findEntrepriseBySiret}
                            documentSupplier={line.read.supplier}
                        />
                    </div>
                    <Select
                        label="Ressource"
                        placeholder="Choisir une ressource"
                        options={ressources.map(({ code, title }) => ({
                            value: code,
                            label: `${code} · ${title}`,
                        }))}
                        value={matchedRessource?.code ?? null}
                        onChange={(code) =>
                            change({
                                matchedRessource:
                                    ressources.find(
                                        (ressource) => ressource.code === code
                                    ) ?? null,
                            })
                        }
                        {...(matchedRessource
                            ? { description: 'Correspondance trouvée' }
                            : {
                                  message: {
                                      severity: 'error' as const,
                                      text: 'Aucune correspondance trouvée',
                                  },
                              })}
                    />
                </div>

                <fieldset className="fr-fieldset fr-mb-0 review-modal__repartition">
                    <legend className="fr-fieldset__legend fr-text--regular fr-text--sm fr-p-0 fr-mb-1v">
                        Répartition par provenance
                    </legend>
                    <ProvenanceEditor
                        distribution={parsedProvenance.distribution}
                        tonnage={line.read.tonnage}
                        departementsByRegion={departementsByRegion}
                        pays={pays}
                        onCreatePays={onCreatePays}
                        onChange={(distribution) =>
                            change({
                                parsedProvenance: {
                                    ...parsedProvenance,
                                    distribution,
                                },
                            })
                        }
                    />
                </fieldset>
            </div>
        </Modal>
    )
}
