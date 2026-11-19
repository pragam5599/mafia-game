// The live server on Vercel's free plan (Firebase Cloud Functions need the paid Blaze plan).
// Speaks the same "callable" protocol as Firebase, so the app's httpsCallable calls work unchanged:
// POST { data } with "Authorization: Bearer <Firebase ID token>" → { result } or { error }.
const { getAuth } = require('firebase-admin/auth');
const { HttpsError } = require('firebase-functions/v2/https');
const fns = require('../lib/index.js');

const LIVE = new Set(['setName', 'createRoom', 'joinRoom', 'leaveRoom', 'removePlayer', 'gameAction', 'playAgain', 'startGame']);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // auth is the ID token, not cookies
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Authorization, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const send = (err) => {
    const e = err instanceof HttpsError ? err : new HttpsError('internal', 'INTERNAL');
    if (!(err instanceof HttpsError)) console.error(err);
    res.status(e.httpErrorCode.status).json({ error: e.toJSON() });
  };

  try {
    const name = req.query.name;
    if (req.method !== 'POST' || !LIVE.has(name)) throw new HttpsError('not-found', 'Not found.');
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    let auth;
    if (token) {
      const decoded = await getAuth().verifyIdToken(token).catch(() => null);
      if (!decoded) throw new HttpsError('unauthenticated', 'Sign in first.');
      auth = { uid: decoded.uid, token: decoded };
    }
    const data = req.body && typeof req.body === 'object' ? req.body.data : undefined;
    const result = await fns[name].run({ data: data ?? null, auth, rawRequest: req });
    res.status(200).json({ result: result ?? null });
  } catch (err) {
    send(err);
  }
};
