import { defineConfig } from 'vite';

// GitHub Pages では https://<user>.github.io/webgl_manabe/ に配信されるため
// base を固定する。ローカルの dev / preview もこの base で動く。
export default defineConfig({
  base: '/webgl_manabe/',
  build: {
    target: 'es2022',
    // three 本体だけで数百 KB あるため、警告のしきい値を現実的な値にする
    chunkSizeWarningLimit: 1200,
  },
});
