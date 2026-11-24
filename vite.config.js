import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://<username>.github.io/ATT-WEB/
// Override with VITE_BASE="/some-other-repo/" when publishing under another name.
const base = process.env.VITE_BASE || '/ATT-WEB/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1500,
    reportCompressedSize: false,
  },
  server: {
    port: 5180,
  },
  preview: {
    port: 5181,
  },
});
