
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This is critical: it replaces `process.env.API_KEY` in your code 
      // with the actual value during the build process.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
