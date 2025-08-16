import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    react(),
    glsl({
      include: ['**/*.glsl', '**/*.wgsl', '**/*.vert', '**/*.frag'],
    }),
  ],
  // If you previously disabled optimizer to work around crypto.hash:
  // optimizeDeps: { disabled: true },
});
