# Deploy RIMS

Bản đang chạy: **<https://yamazato.onrender.com>**

Kiến trúc: **một dịch vụ duy nhất** trên Render (backend phục vụ luôn giao diện),
cơ sở dữ liệu **Neon**, email **Brevo**. Lý do chọn vậy nằm ở mục 6 của
`README.md`.

---

## Đã xong

| Bước | Kết quả thật |
| --- | --- |
| **0 · Docker ở máy** | WSL2 + Docker Desktop chạy được → phụ lục B |
| **1 · Neon** | Project ở **Singapore**, PostgreSQL **18.6**, endpoint direct |
| **2 · Brevo** | Sender `rims <tuandev2111@gmail.com>` đã **Verified** |
| **3 · GitHub** | Đã merge `develop` → `main`, Render build từ `main` |
| **4 · Render** | Service **`yamazato`**, Docker, Singapore, gói Free |

Kiểm lại trên bản thật sau khi lên: `/` và deep link `/admin/dishes` trả HTML,
`/rims/public/restaurant` trả JSON, `/ws-rims/info` sống, `/rims/<sai>` trả JSON
401 chứ không bị SPA nuốt.

## Còn lại

- [ ] **Bước 5** — dựng tài khoản nhân viên
- [ ] **Bước 6** — kiểm thử trên bản thật
- [ ] **Bước 7** — cron giữ cho chạy ổn

---

## Bước 5 — Dựng tài khoản nhân viên

Neon hiện **chỉ có một tài khoản `admin`**. Bàn, danh mục và 43 món thì
`data.sql` đã nạp sẵn lúc khởi động.

- [ ] Đăng nhập `admin`, mật khẩu là `RIMS_ADMIN_PASSWORD` trong `.env`.
      Tài khoản đang mang cờ bắt đổi mật khẩu nên sẽ bị đẩy thẳng sang màn đổi;
      đổi xong phải **đăng nhập lại** vì cờ nằm trong chữ ký của token.
- [ ] Tạo nhân viên. Hai cách:

**Cách A — tự tạo trong màn Quản lý tài khoản.**

**Cách B — chạy công cụ seed, trỏ sang server:**

```bash
cd frontend
RIMS_API=https://yamazato.onrender.com/rims node tools/seed-demo.mjs <mật-khẩu-admin-mới>
```

Script này chỉ dựng **tài khoản và sơ đồ mặt bằng** — không sinh đơn, lượt đặt
hay hoá đơn nào. Tài khoản đã tồn tại thì nó báo 409 rồi đi tiếp, chạy lại được
nhiều lần.

Mật khẩu cấp cho tài khoản mới là giá trị `RIMS_DEFAULT_PASSWORD`, và người nhận
bị bắt đổi ở lần đăng nhập đầu.

---

## Bước 6 — Kiểm thử trên bản thật

- [ ] Mở URL. Nếu dịch vụ đang ngủ thì **chờ tới 3 phút** — xem ghi chú ở Bước 7.
- [ ] Đăng nhập từng vai, xem đúng màn của vai đó.
- [ ] **Quên mật khẩu** — phép thử đường Brevo. Nhớ ngó cả hộp Spam.
- [ ] Đặt bàn → gọi món → thanh toán **tiền mặt** → xem hoá đơn.
- [ ] **Tải hoá đơn PDF.** Đáng thử nhất: chỗ này từng hỏng hẳn khi chạy bằng
      jar mà ở máy vẫn chạy ngon (xem phụ lục C).
- [ ] Thanh toán **VNPay** — phải trả đúng về app, không về `localhost`.
- [ ] **Realtime**: hai tab, một vai Bếp một vai Phục vụ. Gọi món ở tab phục vụ,
      màn bếp phải tự nhảy mà không cần F5.
- [ ] **F5 ở màn sâu**: đang ở `/admin/dishes` bấm F5 → phải dựng lại đúng màn.
- [ ] Vào **Cấu hình nhà hàng** điền địa chỉ và điện thoại — hoá đơn PDF lấy
      thẳng từ đó, để trống thì hoá đơn chỉ có mỗi tên quán.

---

## Bước 7 — Giữ cho chạy ổn

- [ ] Tạo cron ngoài (<https://cron-job.org> hoặc UptimeRobot) ping
      `https://yamazato.onrender.com/rims/public/restaurant`:

      Nhịp       mỗi 10 phút
      Khung giờ  07:30 – 20:30 giờ Việt Nam
      Ngày       tất cả các ngày

- [ ] Vài ngày đầu ngó **Neon → Usage** xem compute tiêu bao nhiêu.

> **Khởi động lạnh mất gần 3 phút, không phải 1 phút.** Log lần deploy đầu ghi
> `Started RimsApplication in 161.098 seconds` — gói Free chỉ có 0.1 CPU. Khách
> mở trang lúc app đang ngủ sẽ đợi chừng đó. Trong giờ mở cửa mà để nó ngủ là
> mất khách, nên cron ở trên không phải tuỳ chọn.

> **Tuyệt đối đừng ping 24/7.** Neon miễn phí có 100 CU-hours ≈ **400 giờ
> compute/tháng**. Thức 24/7 là 730 giờ — vượt gần gấp đôi, và hết hạn mức thì
> compute bị treo tới đầu tháng sau, app mất cơ sở dữ liệu giữa chừng. Các job
> 60 giây trong app truy vấn liên tục nên hễ backend thức là Neon cũng thức.
>
> Khung 07:30–20:30 là **13 giờ/ngày ≈ 395 giờ/tháng** — vừa khít, mà cũng đúng
> nhu cầu: hệ thống chỉ nhận đặt bàn trong 08:00–20:00.

Lúc dịch vụ ngủ, **cả 5 tác vụ `@Scheduled` ngừng chạy**:

| Nhịp | Việc |
| --- | --- |
| 60 giây | `autoUpdateTableStatusToReserved` — đánh dấu bàn `RESERVED` khi sắp tới giờ khách đến |
| 60 giây | `autoCancelReservation` — tự huỷ lượt đặt quá hạn |
| 5 phút | `autoUnlockStaleOrders` — mở khoá đơn kẹt ở `LOCKED` |
| 1 giờ | `cleanupStaleCancelledOrders` — dọn đơn bị huỷ sạch món |
| 1 giờ | `cleanupRevokedTokens` — dọn token đã thu hồi |

Vì dùng `fixedRate`, trạng thái hội tụ lại ở nhịp đầu tiên sau khi thức dậy —
mất thời gian thực, không mất dữ liệu.

---

## Phụ lục A — Cấu hình Render đã dùng

| Ô | Giá trị |
| --- | --- |
| Name | `yamazato` → quyết định URL `https://yamazato.onrender.com` |
| Language | Docker |
| Branch | `main` |
| Region | Singapore |
| Root Directory | *(trống)* |
| Dockerfile Path | `Dockerfile` |
| Docker Build Context | `.` |
| Instance Type | Free — 0.1 CPU, 512 MB |
| Docker Command / Pre-Deploy | *(trống)* |
| Auto-Deploy | On Commit |
| **Health Check Path** | ***(để trống)*** |

> **Vì sao Health Check Path phải để trống.** App không có `/healthz`, cũng
> không có Spring Actuator. Nhưng điền `/healthz` vào thì Render vẫn báo
> **200 OK** — vì `SpaResourceConfig` thấy đường dẫn không có dấu chấm và không
> thuộc `/rims`, nên trả về `index.html`. Đó là 200 giả: Render sẽ báo "healthy"
> kể cả khi Neon sập hoàn toàn, vì file HTML tĩnh thì lúc nào chẳng đọc được.
>
> Để trống thì Render chỉ kiểm cổng có mở không — ít thông tin hơn nhưng thành
> thật. Không dùng `/rims/public/restaurant` vì mỗi lần kiểm là một truy vấn
> xuống Neon, mà ngân sách compute của Neon là thứ chật nhất trong cả kế hoạch.

### Biến môi trường

Render nhận **dán nguyên nội dung `.env`** qua ô *Add from .env*. Nhưng `.env`
thiếu hai biến, vì ở máy chúng rơi về mặc định localhost — **phải thêm tay**:

```
FRONTEND_URL=https://yamazato.onrender.com
VNPAY_RETURN_URL=https://yamazato.onrender.com/rims/cashier/payments/vnpay-callback
```

Thiếu chúng thì app **vẫn chạy** nhưng hỏng âm thầm: CORS cho nhầm origin, và
VNPay trả khách về `localhost` của chính máy khách.

Hai chỗ cần sửa so với `.env` ở máy:

| | |
| --- | --- |
| `JWT_SIGNER_KEY` | **Sinh khoá mới** (`openssl rand -base64 48`). Ai có khoá là tự ký được token giả cho bất kỳ vai nào, kể cả ADMIN |
| `MAIL_FROM_NAME` | **Bỏ đi.** Để trống thì tên người gửi tự lấy theo hồ sơ nhà hàng; đặt cứng thì đổi tên quán mà thư vẫn ký tên cũ |

`VNPAY_TMN_CODE` không có trong `.env` cũng không sao — `application.yaml` có
sẵn mặc định `D90AVGT4` cho sandbox. `VITE_API_BASE_URL` thì kệ nó, đó là biến
của frontend, backend không đọc.

Không cần đặt `SERVER_PORT`: `Dockerfile` tự nghe theo biến `PORT` của Render.

---

## Phụ lục B — Docker ở máy

Ghi lại để lần sau khỏi mò:

- Tính năng Windows `Microsoft-Windows-Subsystem-Linux` đang **Disabled** → đã bật.
- Sau reboot vẫn lỗi `Wsl/CallMsi/ERROR_FILE_NOT_FOUND` vì bản MSI 2.6.3.0 đăng
  ký dở dang. Sửa bằng `winget install --id Microsoft.WSL --force` → **2.7.13.0**.
- **Không cần cài Ubuntu** — Docker Desktop dùng distro `docker-desktop` riêng.

Build và chạy lại (cần PostgreSQL ở máy đang bật):

```bash
cd /x/IdeaProjects/RIMS
docker build -t rims .
docker run --rm -p 8081:8080 --env-file .env \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/rims_db \
  rims
```

Cổng 8081 để không đụng backend dev ở 8080. Ảnh ra **426 MB**; chạy dưới giới
hạn 512 MB thì dùng 352 MB sau 200 request nặng, không bị OOM.

> Nếu thêm thư viện mới mà `npm ci` đứt kiểu `Missing: ... from lock file`:
> lockfile sinh trên Windows thiếu gói tuỳ chọn mà Linux cần, mà npm trên
> Windows vẫn coi là "đồng bộ" nên `npm install` ở máy không phát hiện ra. Sinh
> lại lockfile **bên trong container Linux**:
>
> ```bash
> MSYS_NO_PATHCONV=1 docker run --rm -v "X:\IdeaProjects\RIMS\frontend:/src" \
>   node:22-alpine sh -c 'mkdir /t && cp /src/package*.json /t/ && cd /t \
>   && npm install --package-lock-only && cp package-lock.json /src/'
> ```

> ⚠️ **Đừng dựng lại PostgreSQL bằng Docker.** Đã từng có container
> `rims-postgres` với `restart: unless-stopped`; mỗi lần bật Docker là nó sống
> dậy, chiếm cổng 5432 và che mất PostgreSQL portable — `localhost:5432` trỏ vào
> một cơ sở dữ liệu rỗng khác, nhìn y như mất sạch dữ liệu. Container đó đã xoá.

---

## Phụ lục C — Những lỗi chỉ lộ ra khi deploy

Bốn lỗi tìm được trong quá trình này, đều **không** nhìn thấy khi chạy
`mvn spring-boot:run` ở máy:

| Lỗi | Vì sao chỉ lộ ra lúc deploy |
| --- | --- |
| `npm ci` đứt vì thiếu `@emnapi/*` | Lockfile sinh trên Windows thiếu gói Linux cần; npm trên Windows vẫn báo "đồng bộ" |
| Hoá đơn PDF chết | `fontResource.getFile()` chỉ chạy khi font nằm rời trên đĩa. Đóng thành jar thì font nằm trong jar, không có đường dẫn tệp nào trỏ tới |
| VNPay trả khách về `localhost` | Địa chỉ trả về bị ghi cứng trong mã, biến `VNPAY_RETURN_URL` hoàn toàn vô tác dụng |
| Quản trị viên quên mật khẩu là mất tài khoản | `resetPassword` bảo "dùng chức năng Quên mật khẩu", mà chính luồng đó lại chặn Quản trị viên — hai nhánh chỉ sang nhau |

Bài học: **thử bằng jar hoặc bằng container**, đừng chỉ thử bằng
`mvn spring-boot:run`.

---

## Phụ lục D — Hỏng thì xem đâu

| Triệu chứng | Nhiều khả năng là |
| --- | --- |
| Trang trắng, F12 thấy 401 ở `/assets/*.js` | `SecurityConfig` bị sửa lại thành `.anyRequest().authenticated()` |
| F5 ở màn sâu ra 404 | `SpaResourceConfig` không được nạp, hoặc `dist` chưa vào `resources/static` |
| `Schema-validation: missing table` | `SQL_INIT_MODE` bị đặt thành `never` |
| `connection closed` ở request đầu sau lúc vắng | `max-lifetime` của Hikari bị nới dài hơn ngưỡng Neon cắt |
| Quên mật khẩu trả 503 | `BREVO_API_KEY` sai, `MAIL_FROM_EMAIL` chưa xác minh, hoặc hết hạn mức 300 thư/ngày. Log ghi nguyên văn lý do Brevo trả về |
| App dừng lúc khởi động, log nói thiếu biến | Đúng như log nói — mọi chốt đều in ra tên biến còn thiếu |
| VNPay trả về `localhost` | `VNPAY_RETURN_URL` chưa đặt, hoặc chưa khai lại bên VNPay |
| Email admin sai mà sửa biến không ăn thua | `RIMS_ADMIN_EMAIL` bị đóng đinh ở lần khởi động đầu. Phải `UPDATE` thẳng trong cơ sở dữ liệu |
| Lượt đặt bàn không tự đổi trạng thái | Dịch vụ đang ngủ — xem Bước 7 |
| Ở máy: dữ liệu "biến mất" | Có Postgres thứ hai chiếm cổng 5432 — xem cảnh báo ở phụ lục B |

---

## Phụ lục E — Dọn dữ liệu

Trạng thái hiện tại của Neon: **1 tài khoản `admin`**, 14 bàn, 9 danh mục,
43 món, **0** đơn / hoá đơn / thanh toán / lượt đặt.

Quét sạch phần giao dịch bất cứ lúc nào — thứ tự đã theo đúng khoá ngoại:

```sql
BEGIN;
DELETE FROM payment_transaction;
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM reservations;

-- Bàn chuyển sang SERVING là vì có đơn, sang RESERVED là vì có lượt đặt sắp
-- tới giờ. Xoá hai thứ đó mà quên dòng này thì bàn kẹt vĩnh viễn: sơ đồ báo
-- có khách hoặc đã được giữ, mà mở ra chẳng có gì đứng sau.
UPDATE restaurant_tables SET status = 'AVAILABLE', updated_at = LOCALTIMESTAMP
WHERE status <> 'AVAILABLE';

-- Đánh số lại cho gọn (chỉ chạy khi các bảng đã rỗng).
ALTER TABLE orders       ALTER COLUMN order_id       RESTART WITH 1;
ALTER TABLE order_items  ALTER COLUMN order_item_id  RESTART WITH 1;
ALTER TABLE invoices     ALTER COLUMN invoice_id     RESTART WITH 1;
ALTER TABLE payments     ALTER COLUMN payment_id     RESTART WITH 1;
ALTER TABLE reservations ALTER COLUMN reservation_id RESTART WITH 1;
COMMIT;
```

Giữ nguyên tài khoản, bàn, danh mục và món — chỉ quét sạch phần giao dịch.

---

## Phụ lục F — Lệnh hay dùng ở máy

```bash
# PostgreSQL portable — phải chạy lại sau mỗi lần khởi động máy
MSYS_NO_PATHCONV=1 /c/Users/pc/pgsql-dl/out/pgsql/bin/pg_ctl \
  -D C:/Users/pc/pgsql-data -l C:/Users/pc/pgsql-data/server.log start

# Nối vào cơ sở dữ liệu ở máy
PGPASSWORD=<mật khẩu> /c/Users/pc/pgsql-dl/out/pgsql/bin/psql \
  -U postgres -h localhost -d rims_db

# Nối vào Neon
PGPASSWORD=<mật khẩu Neon> /c/Users/pc/pgsql-dl/out/pgsql/bin/psql \
  "host=<host>.neon.tech port=5432 dbname=neondb user=neondb_owner sslmode=require"

# Backend  (thư mục backend/rims-api)
./mvnw spring-boot:run

# Frontend (thư mục frontend)
npm run dev

# Test
./mvnw test        # backend, 108 test
npx vitest run     # frontend, 45 test

# Chụp lại một màn để đưa vào tài liệu
node tools/look.mjs /admin/dishes admin sáng 1440
```
