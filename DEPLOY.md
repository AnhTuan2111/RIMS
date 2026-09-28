# Deploy RIMS — việc cần làm

Đích đến: app chạy thật trên Internet, **miễn phí**, **không mất chức năng nào**
— kể cả OTP quên mật khẩu lẫn realtime của bếp.

Kiến trúc: **một dịch vụ duy nhất** trên Render (backend phục vụ luôn giao diện),
cơ sở dữ liệu **Neon**, email **Brevo**. Lý do chọn vậy nằm ở mục 6 của
`README.md`.

---

## Bạn đang ở đây

Đã xong, không phải làm lại:

- ✅ WSL2 + Docker Desktop chạy được trên máy → phụ lục B
- ✅ `docker build -t rims .` build sạch, ảnh 426 MB, đã chạy thử và kiểm hết
      các đường (giao diện, deep link, API, WebSocket, đăng nhập). Dưới giới hạn
      512 MB của Render thì dùng 352 MB, không bị OOM.
- ✅ Dữ liệu ở máy đã về trạng thái demo sạch → phụ lục A

Bắt đầu từ **Bước 1**. Bước 1 và 2 làm song song được, và **nên làm sớm** vì cả
hai đều có quãng chờ.

---

## Bước 1 — Cơ sở dữ liệu trên Neon

- [ ] Tạo tài khoản tại <https://neon.com> (đăng nhập bằng GitHub cho nhanh).
- [ ] Tạo project. **Region: Singapore (`ap-southeast-1`)** — gần Việt Nam nhất.
      Chọn region khác thì mỗi truy vấn đội thêm hàng trăm mili giây.
- [ ] Ở Connection Details, chọn kiểu **Java / JDBC**.
- [ ] Dùng endpoint **direct**, KHÔNG dùng bản đuôi `-pooler`. HikariCP trong app
      đã gộp kết nối sẵn, chồng thêm một lớp nữa chỉ thêm rắc rối.
- [ ] Tách thành **ba** biến riêng, đừng nhét user/password vào URL:

      DB_URL       jdbc:postgresql://ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channelBinding=require
      DB_USERNAME  neondb_owner
      DB_PASSWORD  npg_xxxxxxxx

- [ ] **Lưu mật khẩu ngay** — Neon chỉ hiện đầy đủ một lần.

> Không phải tạo bảng gì cả. Lần khởi động đầu, `schema.sql` dựng 12 bảng và
> `data.sql` nạp **14 bàn, 9 danh mục, 43 món**. Cả hai chạy lại được nhiều lần.
> Tài khoản thì `data.sql` cố ý không seed — xem Bước 5.

---

## Bước 2 — Email trên Brevo

Làm sớm: tài khoản mới đôi khi phải chờ Brevo duyệt thủ công mới gửi được.

- [ ] Tạo tài khoản tại <https://www.brevo.com>.
- [ ] **Senders, Domains & Dedicated IPs → Senders → Add a sender**: thêm địa chỉ
      đứng tên gửi. Brevo gửi mã 6 số về chính hộp thư đó. **Không cần sở hữu tên
      miền** — địa chỉ Gmail dùng được.
- [ ] **SMTP & API → API Keys → Generate a new API key**. Copy ngay, chỉ hiện một
      lần.
- [ ] Ghi lại:

      BREVO_API_KEY    xkeysib-xxxxxxxx
      MAIL_FROM_EMAIL  <địa chỉ vừa xác minh>

> Vì sao không dùng thẳng Gmail như ở máy: Render gói miễn phí **chặn cổng SMTP
> 25, 465, 587**, nên `JavaMailSender` hỏng hẳn trên đó — hỏng đúng luồng quên
> mật khẩu. Brevo đi qua HTTPS cổng 443. Bản miễn phí 300 thư/ngày.

---

## Bước 3 — Đẩy code lên GitHub

- [ ] Quyết định Render deploy từ nhánh nào — `develop` hay `main`.
- [ ] `git push origin develop`
- [ ] Nếu chọn `main` thì merge `develop` sang `main` rồi đẩy tiếp.

---

## Bước 4 — Dịch vụ trên Render

- [ ] Tạo tài khoản <https://render.com> bằng GitHub.
- [ ] **New → Web Service** → chọn repo `AnhTuan2111/RIMS`.
- [ ] Điền:

      Name             rims-app         ← quyết định luôn URL, xem ghi chú dưới
      Language         Docker
      Branch           develop (hoặc main)
      Region           Singapore
      Root Directory   (để trống)
      Dockerfile Path  ./Dockerfile
      Instance Type    Free

- [ ] Điền biến môi trường (bảng dưới).
- [ ] **Create Web Service**, rồi xem log build.
- [ ] Log lần đầu phải thấy: tạo bảng → nạp dữ liệu mẫu → `Đã tạo tài khoản quản
      trị đầu tiên "admin"` → `Tomcat started`.

> **Vòng gà-và-trứng**: `FRONTEND_URL` và `VNPAY_RETURN_URL` cần biết URL dịch
> vụ, mà URL chỉ có sau khi tạo. Cách gỡ: **đặt Name trước**, URL sẽ là
> `https://<name>.onrender.com`, điền luôn vào hai biến đó ngay từ đầu.

### Biến môi trường

| Biến | Giá trị | Ghi chú |
| --- | --- | --- |
| `DB_URL` | từ Bước 1 | phải có `?sslmode=require` |
| `DB_USERNAME` | từ Bước 1 | |
| `DB_PASSWORD` | từ Bước 1 | |
| `JWT_SIGNER_KEY` | **sinh mới**: `openssl rand -base64 48` | đừng dùng lại khoá trong `.env` của máy |
| `RIMS_ADMIN_EMAIL` | email của bạn | bắt buộc, là đường lấy lại mật khẩu duy nhất |
| `RIMS_ADMIN_PASSWORD` | bạn chọn | chỉ dùng lần đầu, đăng nhập xong bị bắt đổi ngay |
| `RIMS_DEFAULT_PASSWORD` | bạn chọn | mật khẩu cấp cho tài khoản mới. Không đặt thì rơi về `123456` |
| `MAIL_PROVIDER` | `brevo` | thiếu dòng này là app vẫn cố dùng SMTP rồi hỏng |
| `BREVO_API_KEY` | từ Bước 2 | |
| `MAIL_FROM_EMAIL` | từ Bước 2 | phải là địa chỉ ĐÃ xác minh |
| `MAIL_FROM_NAME` | `RIMS` | tuỳ chọn |
| `FRONTEND_URL` | `https://<name>.onrender.com` | chính URL dịch vụ này |
| `VNPAY_TMN_CODE` | từ VNPay | |
| `VNPAY_HASH_SECRET` | từ VNPay | |
| `VNPAY_RETURN_URL` | `https://<name>.onrender.com/rims/cashier/payments/vnpay-callback` | phải khai lại bên VNPay sandbox |

**Không cần đặt** `SERVER_PORT` (`Dockerfile` tự nghe theo `PORT` của Render), và
không cần `MAIL_USERNAME`/`MAIL_PASSWORD` (chỉ dùng cho đường SMTP).

---

## Bước 5 — Dựng tài khoản trên bản thật

Neon sẽ chỉ có **một** tài khoản `admin` do app tự tạo. Bàn, danh mục và món thì
`data.sql` đã nạp sẵn. Còn thiếu nhân viên và khách.

- [ ] Đăng nhập `admin` bằng `RIMS_ADMIN_PASSWORD` → bị bắt đổi mật khẩu → đổi.
- [ ] Tạo nhân viên. **Hai cách:**

**Cách A — tự tạo trong màn Quản lý tài khoản.** Chậm hơn nhưng chỉ tạo đúng thứ
cần, không kèm dữ liệu rác.

**Cách B — chạy công cụ seed có sẵn**, trỏ sang server:

```bash
cd frontend
RIMS_API=https://<name>.onrender.com/rims node tools/seed-demo.mjs <mật-khẩu-admin-mới>
```

> ⚠️ Công cụ này **không chỉ tạo tài khoản**. Nó còn vẽ mặt bằng, gọi món, đặt
> bàn, cho bếp làm xong và cho thu ngân thanh toán một bàn — tức là sinh ra đơn,
> lượt đặt và hoá đơn. Tốt cho buổi demo, không tốt cho một bản "sạch".
>
> Muốn có tài khoản mà không có giao dịch: chạy cách B rồi xoá phần giao dịch
> bằng đoạn SQL ở phụ lục A.

---

## Bước 6 — Kiểm thử trên bản thật

- [ ] Mở URL. Lần đầu chờ tới **1 phút** nếu dịch vụ đang ngủ.
- [ ] Đăng nhập từng vai, xem đúng màn của vai đó.
- [ ] **Thử Quên mật khẩu** — đây là phép thử đường Brevo. OTP phải về hộp thư.
- [ ] Đặt bàn → gọi món → thanh toán **tiền mặt** → xem hoá đơn.
- [ ] Thanh toán **VNPay**: phải trả đúng về app, không về `localhost`.
- [ ] **Realtime**: mở hai tab, một vai Bếp một vai Phục vụ. Gọi món ở tab phục
      vụ, màn bếp phải tự nhảy mà không cần F5.
- [ ] **F5 ở màn sâu**: đang ở `/admin/dishes` bấm F5 → phải dựng lại đúng màn.

---

## Bước 7 — Giữ cho chạy ổn

- [ ] Tạo cron ngoài (<https://cron-job.org> hoặc UptimeRobot, đều miễn phí) ping
      `https://<name>.onrender.com/rims/public/restaurant`:

      Nhịp       mỗi 10 phút
      Khung giờ  07:30 – 20:30 giờ Việt Nam
      Ngày       tất cả các ngày

- [ ] Vài ngày đầu ngó **Neon → Usage** xem compute tiêu bao nhiêu.

> **Tuyệt đối đừng ping 24/7.** Neon miễn phí có 100 CU-hours ≈ **400 giờ
> compute/tháng**. Thức 24/7 là 730 giờ — vượt gần gấp đôi, và hết hạn mức thì
> compute bị treo tới đầu tháng sau, app mất cơ sở dữ liệu giữa chừng. Các job 60
> giây trong app truy vấn liên tục nên hễ backend thức là Neon cũng thức, không
> tách ra được.
>
> Khung 07:30–20:30 là **13 giờ/ngày ≈ 395 giờ/tháng** — vừa khít, mà cũng đúng
> nhu cầu: hệ thống chỉ nhận đặt bàn trong 08:00–20:00.

Hệ quả phải chấp nhận: lúc dịch vụ ngủ, **cả 5 tác vụ `@Scheduled` ngừng chạy**.

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

## Phụ lục A — Dữ liệu ở máy

Trạng thái hiện tại (đã dọn sạch giao dịch):

| Thứ | Số lượng |
| --- | --- |
| Tài khoản | **8** — `admin`, `chef01`, `chef02`, `waiter01`, `waiter02`, `cashier01`, `kh001`, `kh002` |
| Mật khẩu | `Rims@2026` cho **tất cả**, không tài khoản nào bị bắt đổi |
| Danh mục / Món | 9 / 43 — đủ ảnh, không món nào bị ẩn hay hết hàng |
| Bàn | 14 (B01–B14), tất cả `AVAILABLE` |
| Đơn / Hoá đơn / Thanh toán | **0** |
| Lượt đặt bàn | **0** |

Dọn lại phần giao dịch bất cứ lúc nào — thứ tự đã theo đúng khoá ngoại:

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

## Phụ lục B — Docker ở máy (đã dựng xong)

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

Cổng 8081 để không đụng backend dev ở 8080.

> **Đã gặp ở lần build đầu**: `npm ci` đứt với `Missing: @emnapi/core from lock
> file`. `package-lock.json` sinh trên Windows thiếu hai gói tuỳ chọn mà Linux
> cần, mà npm trên Windows vẫn coi lockfile là "đồng bộ" nên `npm install` ở máy
> không phát hiện ra. Đã sinh lại lockfile **bên trong container Linux**.
>
> Nếu về sau thêm thư viện mới mà `npm ci` lại đứt kiểu này:
>
> ```bash
> MSYS_NO_PATHCONV=1 docker run --rm -v "X:\IdeaProjects\RIMS\frontend:/src" \
>   node:22-alpine sh -c 'mkdir /t && cp /src/package*.json /t/ && cd /t \
>   && npm install --package-lock-only && cp package-lock.json /src/'
> ```

> ⚠️ **Đừng dựng lại PostgreSQL bằng Docker.** Đã từng có container
> `rims-postgres` với `restart: unless-stopped`; mỗi lần bật Docker là nó sống
> dậy, chiếm cổng 5432 và che mất PostgreSQL portable — `localhost:5432` trỏ vào
> một cơ sở dữ liệu rỗng khác, nhìn như mất sạch dữ liệu. Container đó đã bị xoá.

---

## Phụ lục C — Hỏng thì xem đâu

| Triệu chứng | Nhiều khả năng là |
| --- | --- |
| Trang trắng, F12 thấy 401 ở `/assets/*.js` | `SecurityConfig` bị sửa lại thành `.anyRequest().authenticated()` |
| F5 ở màn sâu ra 404 | `SpaResourceConfig` không được nạp, hoặc `dist` chưa vào `resources/static` |
| `Schema-validation: missing table` | `SQL_INIT_MODE` bị đặt thành `never` |
| `connection closed` ở request đầu sau lúc vắng | `max-lifetime` của Hikari bị nới dài hơn ngưỡng Neon cắt |
| Quên mật khẩu trả 503 | Thiếu `MAIL_PROVIDER=brevo`, hoặc `MAIL_FROM_EMAIL` chưa xác minh ở Brevo |
| App dừng lúc khởi động, log nói thiếu biến | Đúng như log nói — mọi chốt đều in ra tên biến còn thiếu |
| VNPay trả về `localhost` | `VNPAY_RETURN_URL` chưa đặt, hoặc chưa khai lại bên VNPay |
| Lượt đặt bàn không tự đổi trạng thái | Dịch vụ đang ngủ — xem Bước 7 |
| Ở máy: dữ liệu "biến mất" | Có Postgres thứ hai chiếm cổng 5432 — xem cảnh báo ở phụ lục B |

---

## Phụ lục D — Lệnh hay dùng ở máy

```bash
# PostgreSQL portable — phải chạy lại sau mỗi lần khởi động máy
MSYS_NO_PATHCONV=1 /c/Users/pc/pgsql-dl/out/pgsql/bin/pg_ctl \
  -D C:/Users/pc/pgsql-data -l C:/Users/pc/pgsql-data/server.log start

# Nối vào cơ sở dữ liệu
PGPASSWORD=<mật khẩu> /c/Users/pc/pgsql-dl/out/pgsql/bin/psql \
  -U postgres -h localhost -d rims_db

# Backend  (thư mục backend/rims-api)
./mvnw spring-boot:run

# Frontend (thư mục frontend)
npm run dev

# Test
./mvnw test        # backend, 108 test
npx vitest run     # frontend, 45 test
```
