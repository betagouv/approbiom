export const normalizeSearchText = (text: string): string =>
    text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
