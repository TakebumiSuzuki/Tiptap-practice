import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // Webプレビューで公開するポートを指定（例: 8080）
    port: 8080,
    // VM外部からもアクセスできるように 0.0.0.0 を指定
    host: '0.0.0.0',

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // もしFlask側で '/api' というプレフィックスをつけていないなら、
        // ここでパスを書き換える設定が必要です（下記※参照）
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
