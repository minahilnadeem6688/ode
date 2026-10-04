import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `ODE_API=http://localhost:8000 npm run dev` sends /api to a local `uvicorn` while developing.
export default defineConfig({
  plugins: [react()],
  server: process.env.ODE_API ? { proxy: { '^/api/(?!_ode/)': process.env.ODE_API } } : undefined,
});
