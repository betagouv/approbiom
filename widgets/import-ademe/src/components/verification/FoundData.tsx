import { useId, useState } from 'react'
import Select, { type SelectProps } from '@shared/react/components/Select'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { ExtractedLineChanges } from '../../extracted-approvisionnement-port'
import ProvenanceEditor from './ProvenanceEditor'
import FournisseurField from './FournisseurField'
import type { SiretLookup } from '../../find-entreprise-by-siret'
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
    findEntrepriseBySiret: (siret: string) => Promise<SiretLookup>
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
    findEntrepriseBySiret,
    onCreatePays,
}: FoundDataProps) {
    const titleId = useId()
    const { matchedFournisseur, matchedRessource } = line.derived

    const [fournisseurSiret, setFournisseurSiret] = useState<
        Entreprise['siret'] | undefined
    >(matchedFournisseur?.siret)
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

    function chooseFournisseur(entreprise: Entreprise | undefined) {
        setFournisseurSiret(entreprise?.siret)
        save('fournisseur', { matchedFournisseur: entreprise ?? null })
    }

    function selectRessource(code: Ressource['code']) {
        setRessourceCode(code)
        save('ressource', {
            matchedRessource:
                ressources.find((ressource) => ressource.code === code) ?? null,
        })
    }

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
                <div className="found-data__field">
                    <FournisseurField
                        entreprises={entreprises}
                        value={fournisseurSiret}
                        onChange={chooseFournisseur}
                        onCreate={onCreateFournisseur}
                        findEntrepriseBySiret={findEntrepriseBySiret}
                        documentSupplier={line.read.supplier}
                        message={
                            failedField === 'fournisseur'
                                ? SAVE_FAILED.message
                                : undefined
                        }
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
