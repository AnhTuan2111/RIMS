# RIMS — Restaurant Internal Management System

Dự án môn học: quản lý nhà hàng (full-stack).

## Yêu cầu

- JDK 21
- Node.js 20+
- SQL Server (database `RMS_DB`)

## Chạy backend

```bash
cd backend/rms-api
./mvnw spring-boot:run
```

API: http://localhost:8080

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173 (proxy `/api` → backend)

## Test backend (không cần SQL Server)

```bash
cd backend/rms-api
./mvnw test
```
