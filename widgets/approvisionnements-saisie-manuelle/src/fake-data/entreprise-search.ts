import type { EntrepriseSearchPort } from '@shared/core/application/ports/entreprise-search'

const FICTIVE_NAMES = [
    'SCIERIE FICTIVE DES COMBES',
    'BOIS FICTIF DU PLATEAU',
    'GRANULES FICTIFS DE LA VALLEE',
    'COOPERATIVE FICTIVE DES CRETES',
]

// Stands in for the Recherche d'entreprises API, with the same cases as the
// mock-up: a SIRET starting with 000 is unknown, 99999999999999 makes the
// service fail, any other gets a fictive name after a short wait.
export const FAKE_ENTREPRISE_SEARCH: EntrepriseSearchPort = {
    getEntrepriseFromQuery: (query) =>
        new Promise((resolve, reject) =>
            setTimeout(() => {
                const siret = query.replace(/\s/g, '')
                if (siret === '99999999999999')
                    return reject(new Error('Service indisponible'))
                if (siret.startsWith('000'))
                    return resolve({
                        entreprises: [],
                        total: { count: 0, atLeast: false },
                    })

                const sum = [...siret].reduce(
                    (total, digit) => total + +digit,
                    0
                )
                resolve({
                    entreprises: [
                        {
                            siret,
                            denomination:
                                FICTIVE_NAMES[sum % FICTIVE_NAMES.length],
                            etatAdministratif: { etat: 'en-activite' },
                            adresse: '1 RUE FICTIVE 00000 COMMUNE FICTIVE',
                        },
                    ],
                    total: { count: 1, atLeast: false },
                })
            }, 900)
        ),
}
