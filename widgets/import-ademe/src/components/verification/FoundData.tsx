import { useId, useState } from 'react'
import Select, { type SelectProps } from '@shared/react/components/Select'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { ExtractedLineChanges } from '../../extracted-approvisionnement-port'
import ProvenanceEditor from './ProvenanceEditor'
import type { DepartementsByRegion } from '@shared/core/application/ports/referentiel-geo'
import type { Pays } from '@shared/core/domain/value-objects/pays'

export type FoundDataProps = {
    line: ExtractedLine
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
    departementsByRegion: readonly DepartementsByRegion[]
    pays: readonly Pays[]
    onUpdate: (changes: ExtractedLineChanges) => Promise<void>
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
}: FoundDataProps) {
    const titleId = useId()
    const { matchedFournisseur, matchedRessource } = line.derived
    const [fournisseurSiret, setFournisseurSiret] = useState<
        Entreprise['siret'] | null
    >(matchedFournisseur?.siret ?? null)
    const [ressourceCode, setRessourceCode] = useState<
        Ressource['code'] | null
    >(matchedRessource?.code ?? null)
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

    function selectFournisseur(siret: Entreprise['siret']) {
        setFournisseurSiret(siret)
        save('fournisseur', {
            matchedFournisseur:
                entreprises.find((entreprise) => entreprise.siret === siret) ??
                null,
        })
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
                <h3 id={titleId} className="fr-text--xs fr-m-0 review__title">
                    Données à importer
                </h3>
                <div className="found-data__field">
                    <Select
                        label="Fournisseur"
                        placeholder="Choisir une entreprise"
                        options={fournisseurOptions}
                        value={fournisseurSiret}
                        onChange={selectFournisseur}
                        {...matchHint(fournisseurSiret)}
                        {...(failedField === 'fournisseur' && SAVE_FAILED)}
                    />
                </div>
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
