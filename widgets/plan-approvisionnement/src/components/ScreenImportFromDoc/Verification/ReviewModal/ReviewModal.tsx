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
import { VERIFIEE } from '@shared/core/domain/value-objects/extracted-approvisionnement-controle'
import type { Referentiels } from '../../../../referentiels'
import FournisseurField from '../../../FournisseurField'
import ProvenanceEditor from '../ProvenanceEditor'
import {
    isVerifiable,
    type ExtractedApprovisionnement,
} from '@shared/core/domain/entities/extracted-approvisionnement'

export type ReviewModalProps = Referentiels & {
    line: ExtractedApprovisionnement
    pays: readonly Pays[]
    // Each change is saved at once.
    onChange: (changes: ExtractedLineChanges) => Promise<void>
    onVerify: () => Promise<void>
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
    onChange,
    onVerify,
    onClose,
    onCreateEntreprise,
    findEntrepriseBySiret,
    onCreatePays,
}: ReviewModalProps) {
    const [failure, setFailure] = useState<string | null>(null)
    const [verifying, setVerifying] = useState(false)

    const { matchedFournisseur, matchedRessource, parsedProvenance } =
        line.derived
    const verified = line.controle === VERIFIEE
    const verifiable = isVerifiable(line)

    function save(changes: ExtractedLineChanges) {
        setFailure(null)
        onChange(changes).catch(() =>
            setFailure(
                "La modification n'a pas pu être enregistrée. Réessayez."
            )
        )
    }

    async function verify() {
        setVerifying(true)
        setFailure(null)
        try {
            await onVerify()
        } catch {
            setFailure(
                "La vérification n'a pas pu être enregistrée. Réessayez."
            )
            setVerifying(false)
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
                    {!verifiable && (
                        <p className="fr-text--sm fr-m-0 review-modal__mention">
                            Choisissez une ressource et au moins une provenance.
                        </p>
                    )}
                    <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                        <li>
                            <button
                                type="button"
                                className="fr-btn fr-icon-check-line"
                                disabled={!verifiable || verified || verifying}
                                onClick={() => void verify()}
                            >
                                {verified
                                    ? 'Ligne vérifiée'
                                    : 'Marquer la ligne comme vérifiée'}
                            </button>
                        </li>
                        <li>
                            <button
                                type="button"
                                className="fr-btn fr-btn--secondary"
                                onClick={onClose}
                            >
                                Fermer
                            </button>
                        </li>
                    </ul>
                </div>
            }
        >
            <div className="review-modal">
                {failure && (
                    <Alert severity="error" size="sm">
                        {failure}
                    </Alert>
                )}

                <div className="review-modal__section">
                    <div>
                        <FournisseurField
                            entreprises={entreprises}
                            value={matchedFournisseur?.siret}
                            onChange={(entreprise) =>
                                save({
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
                            save({
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
                            save({
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
