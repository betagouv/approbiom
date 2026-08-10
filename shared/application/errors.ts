/** The store could not be reached at all. */
export class DataSourceUnavailableError extends Error {}

/** The store answered, but refused to hand the data over. */
export class AccessDeniedError extends Error {}
