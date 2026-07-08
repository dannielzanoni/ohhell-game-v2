import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mooncodeUrl = env.VITE_MOONCODE_URL;

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [react(), tailwindcss()],
    server: mooncodeUrl
      ? {
          proxy: {
            '/mooncode-api': {
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/mooncode-api/, '/api'),
              target: mooncodeUrl,
            },
          },
        }
      : undefined,
  };
});
