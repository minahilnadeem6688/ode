import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `ODE_API=http://localhost:8000 npm run dev` sends /api to a local `uvicorn` while developing.
// Link previews need a full address for their image. On Vercel the production domain is known at build time.
const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '');
const siteUrl = { name: 'site-url', transformIndexHtml: (html) => html.replaceAll('__SITE__', site) };

export default defineConfig({
  plugins: [react(), siteUrl],
  server: process.env.ODE_API ? { proxy: { '^/api/(?!_ode/)': process.env.ODE_API } } : undefined,
});
