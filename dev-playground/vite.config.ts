import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@local/design-system': path.resolve(__dirname, '..', 'design-system', 'src'),
      '@': path.resolve(__dirname, '../OliveBranch')
    }
  },
  server: {
    port: 5174
  }
});
