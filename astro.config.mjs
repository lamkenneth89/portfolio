// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The site is served from https://lamkenneth89.github.io/portfolio/ — the base path is
// deliberate and must stay, so existing inbound links and SEO are preserved.
// Every internal href goes through src/lib/url.ts; never hard-code a leading "/".
export default defineConfig({
  site: 'https://lamkenneth89.github.io',
  base: '/portfolio',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
