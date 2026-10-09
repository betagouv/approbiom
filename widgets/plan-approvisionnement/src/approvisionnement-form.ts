import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

export type ApprovisionnementForm = {
    fournisseur: string | undefined
    ressource: string | null
    provenance: string | null
    tonnage: string
}

export type EditableFields = Pick<
    Approvisionnement,
    'fournisseur' | 'ressource' | 'provenance' | 'tonnageTotal'
>

export const provenanceKey = (provenance: Provenance) =>
    provenance.source === PAYS_ETRANGER
        ? `${PAYS_ETRANGER}|${provenance.libelle}`
        : `${DEPARTEMENT_FRANCAIS}|${provenance.code}`

function toProvenance(key: string): Provenance {
    const [source, value] = key.split(/\|(.*)/)

    return source === PAYS_ETRANGER
        ? { source: PAYS_ETRANGER, libelle: value }
        : { source: DEPARTEMENT_FRANCAIS, code: value }
}

export function parseTonnage(text: string): number | null {
    const tonnage = Number(text.replace(/\s/g, '').replace(',', '.'))

    return text.trim() !== '' && Number.isFinite(tonnage) && tonnage > 0
        ? tonnage
        : null
}

const NUMBER = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 3,
    useGrouping: false,
})

export function toForm(
    approvisionnement: Approvisionnement
): ApprovisionnementForm {
    const { fournisseur, ressource, provenance, tonnageTotal } =
        approvisionnement

    return {
        fournisseur,
        ressource,
        provenance:
            provenance.source === DEPARTEMENT_FRANCAIS && provenance.code === ''
                ? null
                : provenanceKey(provenance),
        tonnage: NUMBER.format(tonnageTotal),
    }
}

export const EMPTY_FORM: ApprovisionnementForm = {
    fournisseur: undefined,
    ressource: null,
    provenance: null,
    tonnage: '',
}

export function toEditableFields(
    form: ApprovisionnementForm
): EditableFields | null {
    const tonnageTotal = parseTonnage(form.tonnage)
    if (
        form.ressource === null ||
        form.provenance === null ||
        tonnageTotal === null
    )
        return null

    return {
        fournisseur: form.fournisseur,
        ressource: form.ressource,
        provenance: toProvenance(form.provenance),
        tonnageTotal,
    }
}
