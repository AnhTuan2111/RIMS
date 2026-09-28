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
| PostgreSQL | 16+ (port 5432)                                      |
| Gửi email  | tài khoản Brevo (HTTP API), chỉ dùng cho OTP quên mật khẩu |

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
| `DB_PASSWORD` | Mật khẩu PostgreSQL | Bạn đặt khi cài PostgreSQL (username mặc định là `postgres`) |
| `BREVO_API_KEY` | Khoá gửi email OTP | [brevo.com](https://www.brevo.com) → SMTP & API → API Keys |
| `MAIL_FROM_EMAIL` | Địa chỉ đứng tên gửi | Phải xác minh trước ở Brevo → Senders. Không cần tên miền riêng, Gmail dùng được |
| `JWT_SIGNER_KEY` | Khoá ký JWT, tối thiểu 32 ký tự | Tự sinh: `openssl rand -base64 48` |
| `VNPAY_HASH_SECRET` | Khoá ký giao dịch VNPay | Trong tài khoản sandbox VNPay |

> **Vì sao không dùng Gmail/SMTP như trước:** nhiều nền tảng lưu trữ chặn
> traffic đi ra ở cổng 25, 465 và 587 để máy chủ của họ không bị dùng phát tán
> thư rác — Render chặn trên gói miễn phí. Ở đó `JavaMailSender` không phải
> chạy chậm mà **không bao giờ kết nối được**, và hỏng đúng luồng quên mật khẩu.
> Brevo đi qua HTTPS cổng 443 nên không vướng, bản miễn phí 300 thư/ngày.
>
> Cố ý **không** giữ đường SMTP dự phòng cho môi trường phát triển: hai đường
> nghĩa là test ở máy một đường rồi deploy bằng đường khác, và luồng thật sự
> chạy trên máy chủ lại là luồng chưa ai thử.

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

### 3.2. Database (PostgreSQL)

Tạo database `rims_db` trên PostgreSQL (hoặc đổi tên rồi sửa biến môi trường
`DB_URL`).

Không cần tạo bảng bằng tay. Lần khởi động đầu, backend chạy hai file trong
`src/main/resources`:

| File | Nội dung |
| --- | --- |
| `schema.sql` | 12 bảng, khoá ngoại, ràng buộc duy nhất, chỉ số |
| `data.sql` | 14 bàn, 9 danh mục, 43 món — **không có tài khoản nào** |

Cả hai đều chạy lại được nhiều lần: `schema.sql` dùng `CREATE TABLE IF NOT
EXISTS`, `data.sql` dùng `INSERT ... ON CONFLICT DO NOTHING`. Khởi động lần thứ
hai không lỗi và không ghi đè dữ liệu đang có.

Về `ddl-auto`: mặc định là **`validate`**. Hibernate chỉ đối chiếu entity với
bảng thật rồi báo lỗi lúc khởi động nếu lệch — nó không còn tự sửa lược đồ nữa.
Lý do đổi: `update` im lặng bỏ qua những thay đổi nó không làm được. Đợt thêm
cột `must_change_password` là ví dụ — thêm cột `NOT NULL` vào bảng đã có dòng
mà không kèm `DEFAULT` thì CSDL từ chối, Hibernate ghi một dòng `WARN` rồi đi
tiếp, app khởi động bình thường, và mọi truy vấn bảng `users` đều lỗi 500.

Sửa entity thì phải sửa `schema.sql` theo. Cách sinh lại file đó nằm ngay trong
phần chú thích đầu file.

Muốn đổi thực đơn mẫu sang nhà hàng khác thì sửa `data.sql` — nó là dữ liệu,
không phải mã nguồn, nên không phải build lại.

### 3.3. Tài khoản quản trị đầu tiên

Repo **không** chứa tài khoản nào. Trước lần chạy đầu, đặt hai biến này trong
`.env`:

```
RIMS_ADMIN_PASSWORD=<mật khẩu bạn chọn>
RIMS_ADMIN_EMAIL=<email của bạn>
```

Email là bắt buộc vì nó là đường lấy lại mật khẩu duy nhất — OTP chỉ gửi qua
email, còn tin nhắn thương hiệu thì đòi giấy phép kinh doanh.

Bảng `users` còn rỗng mà thiếu một trong hai biến thì app **dừng ngay lúc khởi
động** và nói rõ thiếu biến nào. Cố tình như vậy: hệ thống có quản trị viên mà
không ai biết mật khẩu thì vô dụng, còn hệ thống tự đặt mật khẩu đoán được thì
nguy hiểm.

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

1. Khởi động PostgreSQL, tạo database `rims_db`.
2. Copy `.env.example` thành `.env` ở gốc repo rồi điền DB/mail/VNPay của bạn
   (xem mục 3.1). Không sửa `application.yaml` — file đó chỉ có placeholder.
3. Chạy backend (`./mvnw spring-boot:run`) → API sẵn sàng tại `:8080`.
4. Chạy frontend (`npm run dev`) → mở trình duyệt theo địa chỉ Vite in ra.

**Chỉ muốn xem giao diện, chưa dựng được CSDL?** `npm run dev:mock` chạy app
**không cần backend**: mọi lời gọi `/rims/**` được trả bằng dữ liệu giả cố định
trong `frontend/tools/walk-fixtures.mjs` — cùng bảng mà công cụ chụp màn dùng.
Đăng nhập bằng mật khẩu bất kỳ; tên đăng nhập quyết định vai: `admin`,
`chef01`, `waiter01`, `cashier01`, `kh001`. Đây **không phải backend** — nó chỉ
đọc, nên bấm Lưu sẽ không lưu gì.
5. Đăng nhập/đăng ký thử để kiểm tra luồng Auth → Order → Payment → Realtime (WebSocket).

## 6. Đóng gói để deploy

`Dockerfile` ở gốc repo dựng **một ảnh duy nhất chứa cả hai nửa**: nó build
React, chép `frontend/dist` vào thư mục tài nguyên tĩnh của Spring Boot, rồi
đóng gói thành jar.

```bash
docker build -t rims .

# Chạy thử ở máy. Lưu ý DB_URL: trong container thì "localhost" là chính
# container đó, không phải máy bạn — phải trỏ qua host.docker.internal thì mới
# gặp được PostgreSQL đang chạy trên máy.
docker run --rm -p 8080:8080 --env-file .env -e DB_URL=jdbc:postgresql://host.docker.internal:5432/rims_db rims
```

Không bắt buộc phải build được ở máy: nền tảng deploy sẽ tự build từ
`Dockerfile` này. Build ở máy chỉ để biết sớm nếu có gì sai.

Vì sao gộp chứ không tách hai dịch vụ: cùng một tên miền thì `baseURL: '/rims'`
và endpoint `/ws-rims` ở frontend chạy nguyên không phải sửa, không có CORS, và
WebSocket nối thẳng — không vướng giới hạn "rewrite của static site không proxy
được WebSocket" mà một số nền tảng mắc phải.

Đường dẫn của React Router (ví dụ F5 ngay tại `/admin/dishes`) được
`SpaResourceConfig` trả về `index.html`. Lớp đó cố ý **không** đụng tới
`/rims/**` và `/ws-rims/**`, để gọi sai một API vẫn nhận JSON 404 như cũ chứ
không nhận HTML kèm mã 200.

### 6.1. Biến môi trường khi chạy thật

Ngoài các biến ở mục 3.1, khi deploy cần thêm:

| Biến | Vì sao |
| --- | --- |
| `DB_URL` | Trỏ sang CSDL thật. Dịch vụ có quản lý hầu như luôn đòi `?sslmode=require` |
| `FRONTEND_URL` | Chính là URL của dịch vụ này (vì backend phục vụ luôn frontend). Dùng cho CORS và cho chỗ VNPay trả khách về |
| `VNPAY_RETURN_URL` | `https://<tên-miền>/rims/cashier/payments/vnpay-callback`, và phải khai lại bên VNPay |
| `JWT_SIGNER_KEY` | **Sinh khoá mới**, đừng dùng lại khoá của máy phát triển |
| `RIMS_DEFAULT_PASSWORD` | Không đặt thì dùng mặc định trong `application.yaml` — mà ai đọc repo cũng biết |
| — | (email đã khai ở mục 3.1, không cần thêm gì) |

Cổng thì **không cần khai**: `Dockerfile` đã tự nghe theo biến `PORT` mà nền
tảng cấp, và lui về 8080 khi chạy ở máy.

### 6.2. Lưu ý với gói miễn phí

- Dịch vụ ngủ sau một quãng không có ai truy cập, và **cả 5 tác vụ
  `@Scheduled` ngừng chạy trong lúc ngủ**:

  | Nhịp | Việc |
  | --- | --- |
  | 60 giây | `autoUpdateTableStatusToReserved` — đánh dấu bàn `RESERVED` khi sắp tới giờ khách đến |
  | 60 giây | `autoCancelReservation` — tự huỷ lượt đặt quá hạn |
  | 5 phút | `autoUnlockStaleOrders` — mở khoá đơn kẹt ở trạng thái `LOCKED` |
  | 1 giờ | `cleanupStaleCancelledOrders` — dọn đơn bị huỷ sạch món |
  | 1 giờ | `cleanupRevokedTokens` — dọn token đã thu hồi |

  Vì dùng `fixedRate`, trạng thái sẽ hội tụ lại ở nhịp đầu tiên sau khi thức
  dậy — mất thời gian thực chứ không mất dữ liệu.
- CSDL kiểu serverless tính giờ compute. Các job 60 giây truy vấn liên tục nên
  **hễ backend thức là CSDL cũng thức** — đừng ping giữ app thức 24/7 nếu hạn
  mức giờ compute không cho phép. Giữ thức trong giờ mở cửa (08:00–20:00) là
  vừa đủ, vì ngoài khung đó hệ thống cũng không nhận đặt bàn.

## 7. Công nghệ sử dụng

**Backend**: Java 21, Spring Boot 4, Spring Data JPA, Spring Security (JWT),
WebSocket (STOMP), PostgreSQL, VNPay. Gửi email OTP qua HTTP API của Brevo.
Test: JUnit 5 + Mockito + AssertJ.

**Frontend**: React 19, TypeScript, Vite 8, React Router 7, Axios,
SockJS + StompJS (realtime). Test: Vitest. ESLint + Prettier.

Giao diện **không dùng framework CSS và không dùng thư viện icon**. Bootstrap đã
được gỡ; lucide-react cũng đã gỡ. Thay vào đó:

- Bộ component viết riêng trong `frontend/src/styles/rims-kit.css` (tiền tố
  `rk-`), dựng trên các biến trong `tokens.css`. Bộ biến đó cũng là chỗ duy
  nhất khai báo chế độ tối.
- Bộ icon viết riêng trong `frontend/src/shared/components/ui/icons.ts` — một
  bảng chuỗi `<path>`, một component `<Icon name>`. Kiểm thử chặn trôi: icon
  không ai dùng, hoặc icon dùng mà chưa khai nghĩa, đều làm test đỏ.

Hệ thiết kế đầy đủ nằm ở **`design.md`**, và bản **xem được** ở
**`design.html`** (mở từ gốc kho — nó nạp thẳng hai file CSS trên nên không thể
nói khác app).
