import path from 'node:path'
/// <reference types="vitest/config" />
import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'

// @ts-expect-error — plugin thuần JS, không có khai báo kiểu.
import {mockApi} from './tools/mock-api-plugin.mjs'

// .env nằm ở gốc repo để backend và frontend dùng chung một file.
const envDir = path.resolve(__dirname, '..')

export default defineConfig(({mode}) => {
    // Chỉ biến có tiền tố VITE_ mới được nạp — secret của backend trong cùng
    // file .env sẽ không bị lọt vào bundle của trình duyệt.
    const env = loadEnv(mode, envDir, 'VITE_')

    const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8080'

    return {
        // mockApi chỉ gắn ở `vite --mode mock`. Mọi mode khác nó trả về một
        // plugin rỗng và dev server proxy sang backend thật như cũ, nên không
        // có đường nào để chế độ giả lọt vào bản build.
        plugins: [react(), mockApi(mode === 'mock')],
        envDir,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            proxy: {
                '/rims': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/ws-rims': {
                    target: apiTarget,
                    changeOrigin: true,
                    ws: true,
                },
            },
        },

        // Test chỉ chạy trên logic thuần (tính giờ, định dạng, đọc lỗi) nên
        // không cần môi trường DOM giả.
        test: {
            include: ['src/**/*.test.ts'],
            environment: 'node',
        },
    }
})
