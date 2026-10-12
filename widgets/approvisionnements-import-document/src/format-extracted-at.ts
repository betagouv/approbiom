const DAY = new Intl.DateTimeFormat('fr-FR')

export function formatExtractedAt(date: Date): string {
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${DAY.format(date)} à ${date.getHours()}h${minutes}`
}
