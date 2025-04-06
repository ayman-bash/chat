import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3000';
  
  console.log(`Backend URL for ${mode} mode: ${backendUrl}`);
  
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: false, // Permettre le fallback sur un autre port si 5173 est occupé
      cors: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (_, req) => {
              console.log('Proxying request to:', req.url);
            });
          }
        },
        '/socket.io': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ["react", "react-dom", "@react-three/fiber", "three", "three-globe"],
    },
  };
});
