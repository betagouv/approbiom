// Lowercase words without accents, separated by single spaces: punctuation
// counts as a separator, so « SAS DUPONT & FILS » reads « sas dupont fils ».
export function normalizeWords(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

function containsWords(text: string, words: string): boolean {
    return words !== '' && ` ${text} `.includes(` ${words} `)
}

// The item whose label appears as whole words in the text. When several do,
// the longest label is the most specific one.
export function findMostSpecificInText<T>(
    text: string,
    items: readonly T[],
    labelOf: (item: T) => string
): T | undefined {
    const words = normalizeWords(text)

    return items
        .map((item) => ({ item, label: normalizeWords(labelOf(item)) }))
        .filter(({ label }) => containsWords(words, label))
        .sort((a, b) => b.label.length - a.label.length)[0]?.item
}
