import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Arbeitsagentur job API does not allow arbitrary browser origins, so dev/preview proxy it like Vercel/Netlify do.
const proxy = {
  '/api/ba': {
    target: 'https://rest.arbeitsagentur.de',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/ba/, ''),
  },
};

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
