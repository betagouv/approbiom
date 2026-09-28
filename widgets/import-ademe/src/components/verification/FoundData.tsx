import { useId, useState } from 'react'
import Select, { type SelectProps } from '@shared/react/components/Select'
import type { Entreprise } from '@shared/core/domain/entities/entreprise'
import type { Ressource } from '@shared/core/domain/entities/ressource'
import type { ExtractedLine } from '@shared/infrastructure/import-bcib-bciat/helpers'
import type { ExtractedLineChanges } from '../../extracted-approvisionnement-port'
import ProvenanceFound from './ProvenanceFound'

export type FoundDataProps = {
    line: ExtractedLine
    entreprises: readonly Entreprise[]
    ressources: readonly Ressource[]
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
        'fournisseur' | 'ressource' | null
    >(null)

    function save(
        field: 'fournisseur' | 'ressource',
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
            <dl className="review__list">
                <div>
                    <dt className="fr-text--xs fr-m-0 review__label">
                        Répartition trouvée
                    </dt>
                    <dd className="fr-m-0">
                        <ProvenanceFound line={line} />
                    </dd>
                </div>
            </dl>
        </section>
    )
}
