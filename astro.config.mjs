// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/gsap')) return 'gsap';
            if (id.includes('node_modules/react-dom')) return 'react-dom';
            if (id.includes('node_modules/react/')) return 'react';
          },
        },
      },
    },
  },
});