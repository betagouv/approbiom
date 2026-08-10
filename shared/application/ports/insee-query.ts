import type { DepartementsByRegion } from '@shared/application/read-models/departements-by-region'

export interface InseeQuery {
    listDepartementsByRegion(): Promise<readonly DepartementsByRegion[]>
}
