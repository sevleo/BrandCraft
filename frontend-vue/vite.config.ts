import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'emoji-picker',
        },
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // This allows the server to listen on all network interfaces
    port: 5173, // Make sure this matches the port exposed in Dockerfile
    // headers: {
    //   'Cross-Origin-Embedder-Policy': 'require-corp',
    //   'Cross-Origin-Opener-Policy': 'same-origin',
    // },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Base src alias
      '@api': path.resolve(__dirname, './src/api'), // API alias
      '@assets': path.resolve(__dirname, './src/assets'), // API alias
      '@components': path.resolve(__dirname, './src/components'), // Components alias
      '@utils': path.resolve(__dirname, './src/utils'), // Utilities alias
    },
  },
  optimizeDeps: {
    include: ['lucide-vue-next'],
    exclude: [
      'chunk-TJYX3GXB',
      'chunk-C4VHKM2B',
      // '@ffmpeg/ffmpeg',
      // '@ffmpeg/util',
    ], // Add problematic dependencies here
  },
});
