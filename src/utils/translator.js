/**
 * Simple translation utility using Google Translate's free API
 * SL: source language, TL: target language
 */
export async function translate(text, sl = 'en', tl = 'id') {
    if (!text || text.trim() === '') return ''

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`
        const response = await fetch(url)
        const data = await response.json()

        // Google Translate returns an array of segments
        // [ [[segment1, original1], [segment2, original2]], ... ]
        if (data && data[0]) {
            return data[0].map(item => item[0]).join('')
        }

        return text
    } catch (error) {
        console.error('Translation error:', error)
        return text // Fallback to original text
    }
}
