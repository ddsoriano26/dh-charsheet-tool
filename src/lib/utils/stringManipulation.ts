export function capitalize(str?: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function stripHtml(htmlString: string) {
    if (!htmlString) return ''
    const doc = new DOMParser().parseFromString(htmlString, 'text/html')
    return doc.body.textContent?.trim() || ''
}