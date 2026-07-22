# RIMS - Restaurant Internal Management System

## Dự án môn học SWP301 - FPT
Hệ thống quản lý nhà hàng gồm 2 phần:
- **Backend**: Spring Boot (Java) - `backend/rims-api`
- **Frontend**: React + TypeScript + Vite - `frontend`

## 1. Yêu cầu môi trường

| Thành phần | Phiên bản đề xuất                                    |
|------------|------------------------------------------------------|
| JDK        | 21+ (theo Spring Boot 3.x)                           |
| Maven      | dùng kèm Maven Wrapper (`mvnw`), không cần cài riêng |
| Node.js    | 19                                                   |
| npm        | đi kèm Node.js                                       |
| SQL Server | 2019+ (đã bật TCP/IP, port 1433)                     |
| SMTP Gmail | tài khoản dùng để gửi mail (OTP, thông báo...)       |

## 2. Cấu trúc thư mục chính

```
.
├── backend/
│   └── rims-api/            # Spring Boot API
│       ├── src/main/java/vn/edu/fpt/swp391/g6/rimsapi/
│       │   ├── config/       # CORS, Security, WebSocket, VNPay, DB seeder
│       │   ├── controller/   # Admin, Auth, Cashier, Chef, Customer, Waiter
│       │   ├── dto/          # Request/Response DTOs
│       │   ├── entity/       # JPA Entities
│       │   ├── repository/   # Spring Data Repositories
│       │   ├── security/     # JWT, Security filters
│       │   └── service/      # Business logic
│       ├── mvnw / mvnw.cmd
│       └── pom.xml
│
└── frontend/
    └── src/
        ├── app/               # Providers, routes (Admin/Auth/Cashier/Chef/Customer/Waiter)
        ├── features/          # Các trang theo vai trò (admin, cashier, chef, waiter...)
        ├── realtime/          # WebSocket (SockJS + StompJS)
        ├── shared/            # api client, components, hooks, types, utils
        └── styles/            # Bootstrap tuỳ biến theo từng module
```

## 3. Cấu hình Backend

File cấu hình: `backend/rims-api/src/main/resources/application.yaml`

### 3.1. Database (SQL Server)

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=RIMS_DB;encrypt=true;trustServerCertificate=true
    username: sa
    password: <mật khẩu SQL Server của bạn>
```

- Tạo database `RIMS_DB` trên SQL Server (hoặc đổi tên khác rồi sửa `databaseName`).
- `ddl-auto: create` nghĩa là **Hibernate sẽ tự tạo lại toàn bộ schema mỗi lần khởi động** (xoá dữ liệu cũ). Nếu muốn giữ dữ liệu giữa các lần chạy, đổi thành `update` hoặc `validate` sau khi đã seed dữ liệu lần đầu.

### 3.2. Mail (gửi OTP / thông báo)

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: <email gmail>
    password: <app password 16 ký tự>
```

- Dùng **App Password** của Gmail (không dùng mật khẩu đăng nhập thường), yêu cầu bật xác thực 2 bước cho tài khoản Gmail trước.

### 3.3. JWT

```yaml
jwt:
  signerKey: "..."
```

- Chuỗi bí mật để ký/giải mã JWT. Nên đổi sang giá trị ngẫu nhiên riêng khi deploy thật.

### 3.4. VNPay (thanh toán)

```yaml
vnpay:
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  tmn-code: "..."
  hash-secret: "..."
  version: "2.1.0"
  command: "pay"
  return-url: "http://localhost:8080/rims/cashier/payments/vnpay-callback"
```

- Đây là cấu hình **sandbox** VNPay. Khi triển khai production cần đổi `url`, `tmn-code`, `hash-secret` theo tài khoản merchant thật, và `return-url` theo domain thật.


### 3.5. Chạy Backend

Từ thư mục `backend/rims-api`:

**Windows:**
```bash
mvnw.cmd clean install
mvnw.cmd spring-boot:run
```

**macOS/Linux:**
```bash
./mvnw clean install
./mvnw spring-boot:run
```

Server mặc định chạy tại: `http://localhost:8080`

## 4. Cấu hình & chạy Frontend

Từ thư mục `frontend`:

### 4.1. Cài đặt dependencies

```bash
npm install
```

### 4.2. Các script có sẵn (`package.json`)

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server (Vite) |
| `npm run build` | Kiểm tra type (`tsc -b`) rồi build production |
| `npm run preview` | Preview bản build |
| `npm run lint` | Kiểm tra lỗi ESLint |
| `npm run typecheck` | Chỉ kiểm tra kiểu TypeScript |

### 4.3. Chạy môi trường dev

```bash
npm run dev
```

Mặc định Vite sẽ chạy ở `http://localhost:5173` (kiểm tra terminal để biết chính xác cổng).

### 4.4. Kết nối tới Backend

Frontend gọi API qua `axios` (`frontend/src/shared/api/client.ts`) và kết nối realtime qua `sockjs-client` + `stompjs` (`frontend/src/realtime/stompClient.ts`). Đảm bảo:
- Backend đang chạy ở `http://localhost:8080`.
- CORS ở backend (`CorsConfig.java`) cho phép origin của frontend dev server.
- Nếu cấu hình base URL API khác, kiểm tra biến môi trường/constant trong `client.ts` và các file trong `shared/api/`.

## 5. Thứ tự khởi động khuyến nghị

1. Khởi động SQL Server, tạo database `RIMS_DB`.
2. Cập nhật `application.yaml` với thông tin DB/mail/VNPay của bạn.
3. Chạy backend (`./mvnw spring-boot:run`) → API sẵn sàng tại `:8080`.
4. Chạy frontend (`npm run dev`) → mở trình duyệt theo địa chỉ Vite in ra.
5. Đăng nhập/đăng ký thử để kiểm tra luồng Auth → Order → Payment → Realtime (WebSocket).

## 6. Công nghệ sử dụng

**Backend**: Java 21, Spring Boot, Spring Data JPA, Spring Security (JWT), WebSocket (STOMP), SQL Server, VNPay integration, Spring Mail.

**Frontend**: React 19, TypeScript, Vite, React Router 7, Axios, Bootstrap 5, SockJS + StompJS (realtime), ESLint.