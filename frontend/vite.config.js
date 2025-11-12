/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true
    },
    server: {
        port: 3001, // Porta específica para o frontend
        host: true,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('❌ Erro no proxy:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('🔄 Requisição proxy:', req.method, req.url);
                    });
                },
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    utils: ['axios', 'lucide-react']
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
});
