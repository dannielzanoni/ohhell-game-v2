import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const gameVisualConfigPath = fileURLToPath(
  new URL('./src/services/gameVisualConfig.json', import.meta.url),
);

function persistGameVisualConfig() {
  return {
    name: 'persist-game-visual-config',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/game-visual-config', (request, response, next) => {
        if (request.method !== 'PUT') return next();

        let body = '';
        request.on('data', (chunk) => { body += chunk; });
        request.on('end', async () => {
          try {
            const config = JSON.parse(body);
            const profiles = ['desktop', 'mobilePortrait', 'mobileLandscape'];
            const isValid = profiles.every(
              (profile) => config[profile] && typeof config[profile] === 'object',
            );

            if (!isValid) {
              response.statusCode = 400;
              response.end('Invalid visual configuration');
              return;
            }

            await writeFile(gameVisualConfigPath, `${JSON.stringify(config, null, 2)}\n`);
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ ok: true }));
          } catch {
            response.statusCode = 400;
            response.end('Unable to save visual configuration');
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mooncodeUrl = env.VITE_MOONCODE_URL;

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [react(), tailwindcss(), persistGameVisualConfig()],
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
