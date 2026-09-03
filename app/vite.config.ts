import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { devApi } from './dev-api-plugin';

export default defineConfig(({ mode }) => {
  // Make the server-only variables (SUPABASE_*, OWNER_PASSWORD) visible to the
  // dev API plugin. They are never exposed to the browser bundle. A real
  // environment variable always beats one from a .env file.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [react(), tailwindcss(), devApi()],
    build: {
      target: 'es2019',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
