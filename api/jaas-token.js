/**
 * Self Service Studio — JaaS JWT Proxy
 * Vercel Serverless Function (Node.js)
 *
 * Environment variables (set in Vercel dashboard):
 *   JAAS_APP_ID     — your JaaS App ID (e.g. vpaas-magic-cookie-…)
 *   JAAS_KID        — your JaaS key ID  (e.g. vpaas-magic-cookie-…/a1d586)
 *   JAAS_PRIVATE_KEY — RSA private key PEM, with literal \n for newlines
 *   PROXY_TOKEN     — shared secret your team enters in the app
 */

const { createSign } = require('crypto');

function b64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-proxy-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  /* ── Token check ──
     Moderator requests always require a valid PROXY_TOKEN.
     Guest (non-moderator) requests are allowed without a token — the worst
     outcome is someone getting a non-moderator seat, which is low risk. */
  const { isModerator: isMod } = req.body || {};
  const expected = process.env.PROXY_TOKEN || '';
  const received = req.headers['x-proxy-token'] || '';
  if (isMod) {
    if (!expected)             return res.status(500).json({ error: 'Proxy not configured — set PROXY_TOKEN in Vercel.' });
    if (received !== expected) return res.status(401).json({ error: 'Invalid proxy token.' });
  }

  /* ── Config check ── */
  const appId = process.env.JAAS_APP_ID || '';
  const kid   = process.env.JAAS_KID   || '';

  /* Normalise the PEM: Vercel may store it as a single line with literal \n,
     with real newlines, with \r\n, or stripped of headers — handle all cases. */
  const rawKey = (process.env.JAAS_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

  /* Re-wrap bare base64 (no PEM headers) into a valid PKCS#8 PEM block */
  let privateKey = rawKey;
  if (rawKey && !rawKey.startsWith('-----')) {
    const body = rawKey.replace(/\s+/g, '').match(/.{1,64}/g).join('\n');
    privateKey = '-----BEGIN PRIVATE KEY-----\n' + body + '\n-----END PRIVATE KEY-----';
  }

  if (!appId || !kid || !privateKey)
    return res.status(500).json({ error: 'Proxy not configured — set JAAS_APP_ID, JAAS_KID, JAAS_PRIVATE_KEY in Vercel.' });

  /* ── Build JWT ── */
  const { isModerator, userName } = req.body || {};
  const now = Math.floor(Date.now() / 1000);

  const header  = { alg: 'RS256', kid, typ: 'JWT' };
  const payload = {
    aud: 'jitsi', iss: 'chat',
    sub: appId, room: '*',
    exp: now + 86400, nbf: now - 10,
    context: {
      user: {
        moderator: isModerator ? true : false,
        name: userName || (isModerator ? 'Studio Host' : 'Guest'),
        id: require('crypto').randomUUID(),
      },
    },
  };

  const unsigned = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));

  try {
    const sign = createSign('RSA-SHA256');
    sign.update(unsigned);
    const sig = sign.sign(privateKey, 'base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return res.status(200).json({ token: unsigned + '.' + sig, appId });
  } catch (err) {
    /* Temporary debug: show first/last 40 chars and line count so we can diagnose format issues */
    const lines = privateKey.split('\n');
    return res.status(500).json({
      error: 'JWT signing failed: ' + err.message,
      _debug: {
        firstLine: lines[0],
        lastLine:  lines[lines.length - 1],
        lineCount: lines.length,
        totalLen:  privateKey.length,
      },
    });
  }
};
