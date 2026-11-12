import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://reveriecraftlab.github.io',
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});
