import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        open: '/',
        proxy: {
            '/rims': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
})
