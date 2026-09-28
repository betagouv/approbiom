import type { DemandeSubvention } from '@shared/core/domain/entities/demande-subvention'
import type { PlanDApprovisionnement as Plan } from '@shared/core/domain/entities/plan-d-approvisionnement'
import type { ProgrammeAide } from '@shared/core/domain/entities/programme-aide'
import type { DemandeSubventionPort } from '@shared/core/application/ports/demande-subvention'
import type { PlanPort } from '@shared/core/application/ports/plan-d-approvisionnement'
import type { ProgrammeAidePort } from '@shared/core/application/ports/programme-aide'

// PlanView describes what properties are callable for the object Plan in the frontend.
export type PlanView = Plan & {
    appelsAProjet: readonly ProgrammeAide['appelAProjet'][]
}

export type PlanViewPorts = {
    plans: PlanPort
    demandesSubvention: DemandeSubventionPort
    programmesAide: ProgrammeAidePort
}

export function getAppelsAProjetByPlan(
    demandesSubvention: readonly DemandeSubvention[],
    programmesAide: readonly ProgrammeAide[]
): Map<Plan['id'], ProgrammeAide['appelAProjet'][]> {
    const appelById = new Map(
        programmesAide.map(({ id, appelAProjet }) => [id, appelAProjet])
    )

    const appelsByPlan = new Map<Plan['id'], ProgrammeAide['appelAProjet'][]>()

    for (const demande of demandesSubvention) {
        const appel = appelById.get(demande.programmeAide)
        if (!appel) continue

        const appels = appelsByPlan.get(demande.planDApprovisionnement) ?? []
        if (!appels.includes(appel)) appels.push(appel)

        appelsByPlan.set(demande.planDApprovisionnement, appels)
    }

    return appelsByPlan
}

function pick<T, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
    return Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<
        T,
        K
    >
}

type PortsByField = {
    appelsAProjet: 'demandesSubvention' | 'programmesAide'
}

export type PlanViewPortsFor<F extends keyof PlanView> = Pick<
    PlanViewPorts,
    'plans' | PortsByField[F & keyof PortsByField]
>

function requirePort<P>(port: P | undefined, name: keyof PlanViewPorts): P {
    if (port === undefined)
        throw new Error(`listPlans needs the "${name}" port.`)

    return port
}

export async function listPlans<F extends keyof PlanView>(
    fields: readonly F[],
    ports: PlanViewPortsFor<F>
): Promise<Pick<PlanView, F>[]> {
    const wantsAppelsAProjet = (fields as readonly (keyof PlanView)[]).includes(
        'appelsAProjet'
    )

    const given: Partial<PlanViewPorts> = ports

    const [plans, demandesSubvention, programmesAide] = await Promise.all([
        ports.plans.list(),
        wantsAppelsAProjet
            ? requirePort(given.demandesSubvention, 'demandesSubvention').list()
            : [],
        wantsAppelsAProjet
            ? requirePort(given.programmesAide, 'programmesAide').list()
            : [],
    ])

    const appelsByPlan = getAppelsAProjetByPlan(
        demandesSubvention,
        programmesAide
    )

    return plans.map((plan) =>
        pick(
            { ...plan, appelsAProjet: appelsByPlan.get(plan.id) ?? [] },
            fields
        )
    )
}
