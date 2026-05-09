import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  presets: [presetUno()],
  shortcuts: {
    'page-container': 'min-h-screen bg-#f5f7fa',
    'page-content': 'mx-auto max-w-[1440px] p-4 md:p-6',
    'page-toolbar': 'flex flex-wrap items-center justify-between gap-3',
  },
});
