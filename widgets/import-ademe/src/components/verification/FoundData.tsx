import { useId, useRef, useState } from 'react'
import Select, { type SelectProps } from '@shared/react/components/Select'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { ExtractedLineChanges } from '../../extracted-approvisionnement-port'
import ProvenanceEditor from './ProvenanceEditor'
import NewFournisseurForm from './NewFournisseurForm'
import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { Pays } from '@shared/core/domain/value-objects/pays'

export type FoundDataProps = {
    line: ExtractedLine
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
    departementsByRegion: readonly DepartementsByRegion[]
    pays: readonly Pays[]
    onUpdate: (changes: ExtractedLineChanges) => Promise<void>
    onCreateFournisseur: (entreprise: Entreprise) => Promise<void>
    onCreatePays: (pays: Pays) => Promise<void>
}

const SAVE_FAILED = {
    message: {
        severity: 'error',
        text: "Le choix n'a pas pu être enregistré. Réessayez.",
    },
} as const

function matchHint(
    selected: string | null
): Pick<SelectProps<string>, 'description' | 'message'> {
    if (selected === null)
        return {
            message: {
                severity: 'error',
                text: 'Aucune correspondance trouvée',
            },
        }

    return {
        description: 'Correspondance trouvée',
    }
}

export default function FoundData({
    line,
    entreprises,
    ressources,
    departementsByRegion,
    pays,
    onUpdate,
    onCreateFournisseur,
    onCreatePays,
}: FoundDataProps) {
    const titleId = useId()
    const { matchedFournisseur, matchedRessource } = line.derived
    const [fournisseurSiret, setFournisseurSiret] = useState<
        Entreprise['siret'] | null
    >(matchedFournisseur?.siret ?? null)
    const [ressourceCode, setRessourceCode] = useState<
        Ressource['code'] | null
    >(matchedRessource?.code ?? null)
    const [fournisseurEditing, setFournisseurEditing] = useState<
        'select' | 'create' | 'created'
    >('select')
    const fournisseurFieldRef = useRef<HTMLDivElement>(null)
    const [failedField, setFailedField] = useState<
        'fournisseur' | 'ressource' | 'repartition' | null
    >(null)

    function save(
        field: 'fournisseur' | 'ressource' | 'repartition',
        changes: ExtractedLineChanges
    ) {
        setFailedField(null)
        onUpdate(changes).catch(() => setFailedField(field))
    }

    function chooseFournisseur(entreprise: Entreprise) {
        setFournisseurSiret(entreprise.siret)
        save('fournisseur', { matchedFournisseur: entreprise })
    }

    function selectFournisseur(siret: Entreprise['siret']) {
        const entreprise = entreprises.find((e) => e.siret === siret)
        if (entreprise) chooseFournisseur(entreprise)
        setFournisseurEditing('select')
    }

    // The form takes the select's place: the focus goes back to the select
    // once it has closed.
    function closeFournisseurForm(next: 'select' | 'created') {
        setFournisseurEditing(next)
        requestAnimationFrame(() =>
            fournisseurFieldRef.current?.querySelector('select')?.focus()
        )
    }

    async function createFournisseur(entreprise: Entreprise) {
        await onCreateFournisseur(entreprise)
        chooseFournisseur(entreprise)
        closeFournisseurForm('created')
    }

    function selectRessource(code: Ressource['code']) {
        setRessourceCode(code)
        save('ressource', {
            matchedRessource:
                ressources.find((ressource) => ressource.code === code) ?? null,
        })
    }

    const fournisseurOptions = entreprises.map(({ denomination, siret }) => ({
        value: siret,
        label: `${denomination} — ${siret}`,
    }))
    const ressourceOptions = ressources.map(({ code, description }) => ({
        value: code,
        label: `${code} · ${description}`,
    }))

    return (
        <>
            <section className="review__section" aria-labelledby={titleId}>
                <h3 id={titleId} className="fr-h6 fr-m-0">
                    Données retenues
                </h3>
                {fournisseurEditing === 'create' ? (
                    <NewFournisseurForm
                        defaultDenomination={line.read.supplier}
                        entreprises={entreprises}
                        onCreate={createFournisseur}
                        onSelectExisting={(entreprise) => {
                            chooseFournisseur(entreprise)
                            closeFournisseurForm('select')
                        }}
                        onCancel={() => closeFournisseurForm('select')}
                    />
                ) : (
                    <div
                        ref={fournisseurFieldRef}
                        className="found-data__field"
                    >
                        <Select
                            label="Fournisseur"
                            placeholder="Choisir une entreprise"
                            options={fournisseurOptions}
                            value={fournisseurSiret}
                            onChange={selectFournisseur}
                            {...(fournisseurEditing === 'created'
                                ? {
                                      message: {
                                          severity: 'valid',
                                          text: 'Fournisseur créé',
                                      },
                                  }
                                : matchHint(fournisseurSiret))}
                            {...(failedField === 'fournisseur' && SAVE_FAILED)}
                        />
                        {fournisseurSiret === null && (
                            <button
                                type="button"
                                className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-add-line fr-mt-1v"
                                onClick={() => setFournisseurEditing('create')}
                            >
                                Créer le fournisseur « {line.read.supplier} »
                            </button>
                        )}
                    </div>
                )}
                <div className="found-data__field">
                    <Select
                        label="Ressource"
                        placeholder="Choisir une ressource"
                        options={ressourceOptions}
                        value={ressourceCode}
                        onChange={selectRessource}
                        {...matchHint(ressourceCode)}
                        {...(failedField === 'ressource' && SAVE_FAILED)}
                    />
                </div>
            </section>
            <fieldset className="fr-fieldset fr-mb-0 review__repartition">
                <legend className="fr-fieldset__legend fr-text--regular fr-text--sm fr-p-0 fr-mb-1v">
                    Répartition par provenance
                </legend>
                <ProvenanceEditor
                    distribution={line.derived.parsedProvenance.distribution}
                    tonnage={line.read.tonnage}
                    departementsByRegion={departementsByRegion}
                    pays={pays}
                    onCreatePays={onCreatePays}
                    onChange={(distribution) =>
                        save('repartition', {
                            parsedProvenance: {
                                ...line.derived.parsedProvenance,
                                distribution,
                            },
                        })
                    }
                />
                {failedField === 'repartition' && (
                    <p className="fr-message fr-message--error">
                        {SAVE_FAILED.message.text}
                    </p>
                )}
                {line.derived.parsedProvenance.unrecognized.length > 0 && (
                    <p className="fr-text--sm fr-m-0">
                        <span className="review__label">Non reconnu : </span>
                        {line.derived.parsedProvenance.unrecognized.join(', ')}
                    </p>
                )}
            </fieldset>
        </>
    )
}
