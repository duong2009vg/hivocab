// api/_cors.js
// Shared CORS helper for HiVocab Vercel Serverless Functions

const ALLOWED_ORIGINS = [
    'https://hivocab.site',
    'https://www.hivocab.site',
    'https://hivocab.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
];

/**
 * Sets CORS headers based on request origin whitelist.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string[]} [allowedMethods=['GET', 'POST', 'OPTIONS']]
 */
export function setCors(req, res, allowedMethods = ['GET', 'POST', 'OPTIONS']) {
    const origin = req.headers?.origin;
    if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('chrome-extension://'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Same-origin or server-to-server request
        res.setHeader('Access-Control-Allow-Origin', 'https://hivocab.site');
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
}

/**
 * Convenience helper to set CORS and immediately handle OPTIONS preflight.
 * @returns {boolean} true if request was OPTIONS and already handled
 */
export function handleCors(req, res, allowedMethods = ['GET', 'POST', 'OPTIONS']) {
    setCors(req, res, allowedMethods);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }
    return false;
}

export default { setCors, handleCors };
