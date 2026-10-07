import type { Approvisionnement } from '@shared/core/domain/entities/approvisionnement'
import {
    DEPARTEMENT_FRANCAIS,
    PAYS_ETRANGER,
    type Provenance,
} from '@shared/core/domain/value-objects/provenance'

// The value of the « Non renseigné » choice: a SIRET is never empty.
export const NO_FOURNISSEUR = ''

// What the fields of the form hold. Null is nothing chosen yet.
export type ApprovisionnementForm = {
    // A SIRET, or NO_FOURNISSEUR.
    fournisseur: string | null
    ressource: string | null
    // One key per provenance, see `provenanceKey`.
    provenance: string | null
    // As typed.
    tonnage: string
}

export type EditableFields = Pick<
    Approvisionnement,
    'fournisseur' | 'ressource' | 'provenance' | 'tonnageTotal'
>

// A département and a country never share a key, even with the same name.
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

// « 1 200,5 » as well as « 1200.5 ». Null for anything that is not a
// tonnage above zero.
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
        fournisseur: fournisseur ?? NO_FOURNISSEUR,
        ressource,
        // A département left blank has to be chosen again.
        provenance:
            provenance.source === DEPARTEMENT_FRANCAIS && provenance.code === ''
                ? null
                : provenanceKey(provenance),
        tonnage: NUMBER.format(tonnageTotal),
    }
}

// Null while a field is missing or wrong: the form cannot be saved then.
export function toEditableFields(
    form: ApprovisionnementForm
): EditableFields | null {
    const tonnageTotal = parseTonnage(form.tonnage)
    if (
        form.fournisseur === null ||
        form.ressource === null ||
        form.provenance === null ||
        tonnageTotal === null
    )
        return null

    return {
        fournisseur:
            form.fournisseur === NO_FOURNISSEUR ? undefined : form.fournisseur,
        ressource: form.ressource,
        provenance: toProvenance(form.provenance),
        tonnageTotal,
    }
}
