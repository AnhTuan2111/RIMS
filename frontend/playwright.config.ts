import {defineConfig} from '@playwright/test'

/**
 * Kiểm chức năng đầu-cuối: bấm qua app THẬT, backend THẬT, CSDL THẬT.
 *
 * <p>Chạy MỘT luồng duy nhất (`workers: 1`). Các bài kiểm này dùng chung một
 * cơ sở dữ liệu và chúng đổi dữ liệu của nhau — bàn được gọi món xong thì
 * không còn trống, đơn đã thu thì không thu lại được. Chạy song song sẽ cho
 * ra những lần đỏ ngẫu nhiên, thứ tệ hơn là không kiểm gì.
 *
 * <p>Dùng Edge sẵn có thay vì tải Chromium riêng: máy này tải Chromium hỏng,
 * và Edge cũng là Chromium.
 *
 * Trước khi chạy:
 *   - backend ở :8080  (cd backend/rims-api && ./mvnw spring-boot:run)
 *   - frontend ở :5173 (cd frontend && npm run dev)
 *   - dữ liệu nền     (cd frontend && node tools/seed-demo.mjs Rims@2026)
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 45_000,
    expect: {timeout: 10_000},
    workers: 1,
    fullyParallel: false,
    reporter: [['list']],
    use: {
        baseURL: process.env.E2E_BASE ?? 'http://localhost:5173',
        channel: 'msedge',
        headless: true,
        locale: 'vi-VN',
        viewport: {width: 1440, height: 900},
        // Chụp lại lúc hỏng: một bài đỏ không kèm ảnh thì phải chạy lại mới
        // biết nó hỏng ở đâu.
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
})
