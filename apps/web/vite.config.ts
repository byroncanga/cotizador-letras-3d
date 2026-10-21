import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins:[react(),tailwind()],
  server:{port:5173,strictPort:true,proxy:{'/geometry':{target:'http://127.0.0.1:4100',rewrite:path=>path.replace(/^\/geometry/,'')},'/local':{target:'http://127.0.0.1:8000'},'/api':{target:'http://127.0.0.1:8000'},'/sanctum':{target:'http://127.0.0.1:8000'}}},
  preview:{port:5173,strictPort:true},
});
