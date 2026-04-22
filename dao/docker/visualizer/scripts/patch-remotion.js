const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@remotion',
  'studio-server',
  'dist',
  'routes.js'
);

if (!fs.existsSync(target)) {
  console.warn('[patch-remotion] routes.js not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(target, 'utf8');

const oldCheck = `if (originUrl.host !== host) {
            throw new Error('Request from different origin not allowed');`;

const newCheck = `const originHost = originUrl.hostname;
            const reqHost = (host || '').split(':')[0];
            const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(originHost) && ['localhost', '127.0.0.1', '::1'].includes(reqHost);
            if (originUrl.host !== host && !isLocalhost) {
            throw new Error('Request from different origin not allowed');`;

if (!content.includes(oldCheck)) {
  console.warn('[patch-remotion] target code not found, patch may already be applied or version changed');
  process.exit(0);
}

content = content.replace(oldCheck, newCheck);
fs.writeFileSync(target, content, 'utf8');
console.log('[patch-remotion] patched validateSameOrigin to allow localhost origins');
