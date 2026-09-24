# RIMS - Restaurant Internal Management System

## Dự án môn học SWP391 - FPT
Thành viên tham gia:
|MSSV     |Tên                 |
|---------|--------------------|
|HE190385 |Nguyễn Thành Vinh   |
|HE194015 |Phạm Tuấn Anh       |
|HE172532 |Nguyễn Thị Thu Hiền |
|HE191779 |Nguyễn Xuân Bắc     |
|HE191410 |Phạm Minh Nghĩa     |
|HE200426 |Nguyễn Anh Tuấn     |

Hệ thống quản lý nhà hàng gồm 2 phần:
- **Backend**: Spring Boot (Java) - `backend/rims-api`
- **Frontend**: React + TypeScript + Vite - `frontend`

## 1. Yêu cầu môi trường

| Thành phần | Phiên bản đề xuất                                    |
|------------|------------------------------------------------------|
| JDK        | 21 (Spring Boot 4.0)                                 |
| Maven      | dùng kèm Maven Wrapper (`mvnw`), không cần cài riêng |
| Node.js    | 20.19+ hoặc 22+ (Vite 8 yêu cầu)                     |
| npm        | đi kèm Node.js                                       |
| SQL Server | 2019+ (đã bật TCP/IP, port 1433)                     |
| SMTP Gmail | tài khoản dùng để gửi mail (OTP, thông báo...)       |

## 2. Cấu trúc thư mục chính

```
.
├── backend/
│   └── rims-api/            # Spring Boot API
│       ├── src/main/java/vn/edu/fpt/swp391/g6/rimsapi/
│       │   ├── config/       # CORS, Security, WebSocket, VNPay, tài khoản quản trị đầu tiên
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
        └── styles/            # 4 file: tokens, bộ component rk-*, trang chủ
```

## 3. Cấu hình Backend

Cấu hình dùng chung nằm ở `backend/rims-api/src/main/resources/application.yaml` và **được commit**.
File này chỉ chứa placeholder, không chứa giá trị bí mật nào.

### 3.1. Điền secret cho máy của bạn

Cả backend lẫn frontend dùng chung **một file `.env` duy nhất ở gốc repo**.

```bash
cp .env.example .env
```

Rồi mở `.env` điền giá trị thật. File này đã nằm trong `.gitignore` nên không bao giờ bị commit.

Năm giá trị bắt buộc — thiếu là backend không khởi động được:

| Biến | Là gì | Lấy ở đâu |
|---|---|---|
| `DB_PASSWORD` | Mật khẩu SQL Server | Bạn đặt khi cài SQL Server (username mặc định là `sa`) |
| `MAIL_USERNAME` | Email gửi OTP | Tài khoản Gmail của bạn |
| `MAIL_PASSWORD` | App Password 16 ký tự | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — phải bật xác thực 2 bước trước. Không dùng mật khẩu đăng nhập thường. |
| `JWT_SIGNER_KEY` | Khoá ký JWT, tối thiểu 32 ký tự | Tự sinh: `openssl rand -base64 48` |
| `VNPAY_HASH_SECRET` | Khoá ký giao dịch VNPay | Trong tài khoản sandbox VNPay |

Ngoài ra `VITE_API_BASE_URL` cho frontend biết backend chạy ở đâu (mặc định
`http://localhost:8080`). Các biến còn lại đều có giá trị mặc định trong
`application.yaml`, xem phần cuối `.env.example`.

**Cách hai bên đọc file này:**

- **Backend** — `application.yaml` khai báo `spring.config.import` trỏ tới `.env`.
  Cú pháp `KEY=VALUE` của `.env` chính là cú pháp file `.properties`, nên chỉ cần
  gợi ý định dạng `[.properties]` là Spring đọc được thẳng, không cần thư viện nào.
- **Frontend** — `vite.config.ts` đặt `envDir` trỏ về gốc repo. Vite **chỉ** nạp
  biến có tiền tố `VITE_`, nên secret của backend nằm cùng file cũng không lọt
  vào bundle của trình duyệt.

> Vì Spring đọc `.env` như file `.properties`, dấu `\` là ký tự escape.
> Nếu giá trị nào có dấu `\` thì phải viết thành `\\`.

Nếu không muốn dùng file, đặt thẳng biến môi trường cùng tên cũng được —
biến môi trường được ưu tiên hơn giá trị trong `.env`.

### 3.2. Database (SQL Server)

Tạo database `RIMS_DB` trên SQL Server (hoặc đổi tên rồi sửa biến môi trường `DB_URL`).

Không cần tạo bảng bằng tay. Lần khởi động đầu, backend chạy hai file trong
`src/main/resources`:

| File | Nội dung |
| --- | --- |
| `schema.sql` | 12 bảng, khoá ngoại, ràng buộc duy nhất, chỉ số |
| `data.sql` | 14 bàn, 9 danh mục, 43 món — **không có tài khoản nào** |

Cả hai đều kiểm tra tồn tại trước khi tạo, nên khởi động lần thứ hai không lỗi
và không ghi đè dữ liệu đang có.

Về `ddl-auto`: mặc định là **`validate`**. Hibernate chỉ đối chiếu entity với
bảng thật rồi báo lỗi lúc khởi động nếu lệch — nó không còn tự sửa lược đồ nữa.
Lý do đổi: `update` im lặng bỏ qua những thay đổi nó không làm được. Đợt thêm
cột `must_change_password` là ví dụ — SQL Server từ chối thêm cột `NOT NULL`
vào bảng đã có dòng, Hibernate ghi một dòng `WARN` rồi đi tiếp, app khởi động
bình thường, và mọi truy vấn bảng `users` đều lỗi 500.

Sửa entity thì phải sửa `schema.sql` theo. Cách sinh lại file đó nằm ngay trong
phần chú thích đầu file.

Muốn đổi thực đơn mẫu sang nhà hàng khác thì sửa `data.sql` — nó là dữ liệu,
không phải mã nguồn, nên không phải build lại.

### 3.3. Tài khoản quản trị đầu tiên

Repo **không** chứa tài khoản nào. Trước lần chạy đầu, đặt mật khẩu quản trị
trong `.env`:

```
RIMS_ADMIN_PASSWORD=<mật khẩu bạn chọn>
```

Bảng `users` còn rỗng mà thiếu biến này thì app **dừng ngay lúc khởi động** và
in ra hướng dẫn. Cố tình như vậy: hệ thống có quản trị viên mà không ai biết mật
khẩu thì vô dụng, còn hệ thống tự đặt mật khẩu đoán được thì nguy hiểm.

Tài khoản tạo ra tên `admin` (đổi bằng `RIMS_ADMIN_USERNAME`) và bị bắt đổi mật
khẩu ngay lần đăng nhập đầu — mật khẩu đặt qua biến môi trường vẫn nằm trong
lịch sử shell và file cấu hình triển khai.

Đã có người dùng trong CSDL thì bước này không chạy, kể cả khi biến đổi giá trị.

### 3.4. Chạy Backend

Từ thư mục `backend/rims-api`:

```bash
# Windows
mvnw.cmd spring-boot:run

# macOS/Linux
./mvnw spring-boot:run
```

Không còn profile riêng cho lần đầu: `schema.sql` và `data.sql` chạy lại được
nhiều lần nên lần nào cũng dùng đúng một lệnh này. Profile `dev` giờ chỉ bật
`show-sql`.

Server mặc định chạy tại: `http://localhost:8080`

### 3.5. Nhận diện nhà hàng

Tên quán, câu giới thiệu, địa chỉ, điện thoại không nằm trong mã nguồn. Lần
khởi động đầu chúng đọc từ `app.restaurant.*` trong `application.yaml`, đặt
được qua biến môi trường:

```
RESTAURANT_NAME=Tên quán của bạn
RESTAURANT_TAGLINE=Câu giới thiệu ngắn
RESTAURANT_DESCRIPTION=Đoạn mô tả trên trang chủ
RESTAURANT_ADDRESS=
RESTAURANT_PHONE=
RESTAURANT_EMAIL=
```

Sau lần đầu, **cơ sở dữ liệu là nguồn thật** — chủ quán sửa trong màn Cấu hình
nhà hàng, và đổi các biến này về sau không ghi đè lên dữ liệu đã có.

### 3.6. Mật khẩu tài khoản

Tài khoản mới tạo và tài khoản vừa được Quản trị viên đặt lại đều mang mật khẩu
do người khác biết. Chuỗi đó lấy từ `RIMS_DEFAULT_PASSWORD`; không đặt thì rơi
về giá trị mặc định ghi trong `application.yaml`, mà giá trị đó ai đọc repo cũng
biết — **hãy đặt biến này khi chạy thật**. Hệ thống **bắt đổi** trước khi cho dùng:

- Đăng nhập xong là vào thẳng màn `/change-password`, không vào được màn nào khác.
- Backend chặn thật chứ không chỉ chặn giao diện: `MustChangePasswordFilter` trả
  403 cho mọi endpoint trừ xem hồ sơ của chính mình, đổi mật khẩu, làm mới token
  và đăng xuất. Kênh WebSocket cũng bị từ chối.
- Đổi xong thì đăng xuất và đăng nhập lại — cờ nằm trong chữ ký của access token
  nên chỉ token mới mới sạch cờ.
- Mọi vai trò đều tự đổi được mật khẩu của mình ở màn **Hồ sơ cá nhân**.

Quản trị viên không đặt lại được mật khẩu của Quản trị viên khác; tài khoản đó
dùng luồng **Quên mật khẩu** qua email.

### 3.7. VNPay

Cấu hình mặc định trỏ tới **sandbox**. Khi deploy thật cần đổi `vnpay.url`,
`VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` theo tài khoản merchant, và `VNPAY_RETURN_URL` theo domain thật.

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
| `npm run build` | Kiểm tra kiểu, chạy test, rồi build production |
| `npm run preview` | Preview bản build |
| `npm run lint` | Kiểm tra lỗi ESLint |
| `npm run lint:fix` | Sửa những lỗi ESLint tự sửa được |
| `npm run typecheck` | Chỉ kiểm tra kiểu TypeScript (`tsc -b`) |
| `npm run format` | Chạy Prettier ghi đè |
| `npm run format:check` | Kiểm tra format, không sửa |
| `npm test` | Chạy test (Vitest) |

> Kiểm kiểu phải gọi `npm run typecheck`, **không** gọi `npx tsc --noEmit`.
> `tsconfig.json` ở gốc là dạng references với `"files": []`, nên `--noEmit`
> chạy qua mà không kiểm file nào cả.

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
2. Copy `.env.example` thành `.env` ở gốc repo rồi điền DB/mail/VNPay của bạn
   (xem mục 3.1). Không sửa `application.yaml` — file đó chỉ có placeholder.
3. Chạy backend (`./mvnw spring-boot:run`) → API sẵn sàng tại `:8080`.
4. Chạy frontend (`npm run dev`) → mở trình duyệt theo địa chỉ Vite in ra.
5. Đăng nhập/đăng ký thử để kiểm tra luồng Auth → Order → Payment → Realtime (WebSocket).

## 6. Công nghệ sử dụng

**Backend**: Java 21, Spring Boot 4, Spring Data JPA, Spring Security (JWT),
WebSocket (STOMP), SQL Server, VNPay, Spring Mail. Test: JUnit 5 + Mockito +
AssertJ.

**Frontend**: React 19, TypeScript, Vite 8, React Router 7, Axios,
SockJS + StompJS (realtime), lucide-react (icon). Test: Vitest.
ESLint + Prettier.

Giao diện **không dùng framework CSS**. Bootstrap đã được gỡ; thay vào đó là một
bộ component viết riêng trong `frontend/src/styles/rims-kit.css` (tiền tố `rk-`)
dựng trên các biến màu và khoảng cách trong `tokens.css`. Bộ biến đó cũng là chỗ
duy nhất khai báo chế độ tối.
