// Universal Entry Point for Node 20.x, Node 22.x, Hostinger Express preset, and AI Studio dev
// Intentionally uses CommonJS syntax without static ESM imports or TypeScript-only tokens
// so that `node server.ts` works natively on Node 20.x (Hostinger Default) as well as Node 22.x.
if (process.env.VITE_DEV_SERVER === 'true') {
  import('./src/server-app.ts');
} else {
  require('./server.js');
}
