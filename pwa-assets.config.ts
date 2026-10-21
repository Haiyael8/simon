import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates PNG/ICO icons from the single SVG source (ADR-7)
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // Icon already fills its own background, so no extra padding or fill is needed
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
});
