const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export const formatNumber = (value: number): string => NUMBER.format(value)

export const plural = (count: number, word: string): string =>
    `${count} ${word}${count > 1 ? 's' : ''}`
