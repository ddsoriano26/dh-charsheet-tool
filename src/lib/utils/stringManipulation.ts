export function capitalize(str?: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function stripHtml(htmlString: string) {
    if (!htmlString) return ''
    const doc = new DOMParser().parseFromString(htmlString, 'text/html')
    return doc.body.textContent?.trim() || ''
}

export function sanitizeForPdf(value: string) {
    if (typeof value !== 'string') return value

    return value
            .replace(/\u2013/g, '-')
            .replace(/\u2014/g, '-')
            .replace(/\u2012/g, '-')
            .replace(/\u2015/g, '-')
            .replace(/\u2212/g, '-')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\u2026/g, '...')
}