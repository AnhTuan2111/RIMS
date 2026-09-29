# Deploy RIMS

Hướng dẫn đưa RIMS lên máy chủ thật, **miễn phí hoàn toàn**, không cắt bớt chức
năng nào. Làm từ đầu đến cuối mất khoảng một tiếng.

Bản mẫu đang chạy: <https://yamazato.onrender.com>

---

## Kiến trúc

```
                    ┌──────────────────────────────┐
   Trình duyệt ───► │  Render — MỘT dịch vụ Docker │
                    │  Spring Boot + React trong   │
                    │  cùng một jar                │
                    └───┬──────────┬───────────┬───┘
                        │          │           │
                   Neon │    Brevo │     VNPay │
              PostgreSQL│  email   │  thanh toán
```

**Một dịch vụ, không phải hai.** `Dockerfile` ở gốc repo build React rồi chép
`frontend/dist` vào thư mục tĩnh của Spring Boot trước khi đóng jar. Cùng một
tên miền nghĩa là:

- `baseURL: '/rims'` và endpoint `/ws-rims` ở frontend chạy nguyên, không sửa gì
- không có CORS giữa hai nửa
- WebSocket nối thẳng — không vướng giới hạn "rewrite của static site không
  proxy được WebSocket" mà nhiều nền tảng mắc phải

Tách làm hai dịch vụ thì mất cả ba điều trên, đổi lại chẳng được gì.

---

## Cần chuẩn bị

| Việc | Ở đâu | Mất bao lâu |
| --- | --- | --- |
| Tài khoản GitHub, đã đẩy mã nguồn lên | [github.com](https://github.com) | — |
| Tài khoản Neon (cơ sở dữ liệu) | [neon.tech](https://neon.tech) | 2 phút |
| Tài khoản Brevo (gửi email) | [brevo.com](https://www.brevo.com) | 5 phút |
| Tài khoản VNPay sandbox | [sandbox.vnpayment.vn](https://sandbox.vnpayment.vn) | 10 phút |
| Tài khoản Render (máy chủ) | [render.com](https://render.com) | 2 phút |

Tất cả đều có gói miễn phí đủ dùng. Không cần thẻ tín dụng.

---

## Bước 1 — Cơ sở dữ liệu trên Neon

Neon là PostgreSQL chạy theo kiểu serverless: ngủ khi không ai dùng, tính tiền
theo giờ compute thay vì theo máy chủ dựng sẵn. Gói miễn phí cho **0,5 GB dung
lượng và 100 CU-hours mỗi tháng** — thừa cho một đồ án.

1. Tạo project mới. **Region chọn gần người dùng nhất** (Singapore cho Việt
   Nam) — độ trễ mỗi truy vấn phụ thuộc vào đây.
2. Đặt tên database, ví dụ `rims_db`.
3. Vào **Connection Details**, copy chuỗi kết nối.

Neon cho hai dạng địa chỉ và **phải chọn đúng**:

| Dạng | Ví dụ | Dùng khi nào |
| --- | --- | --- |
| Direct | `ep-xxx.region.aws.neon.tech` | ✅ Dùng cái này |
| Pooled | `ep-xxx-pooler.region.aws.neon.tech` | Khi ứng dụng mở rất nhiều kết nối ngắn |

RIMS dùng HikariCP nên **tự giữ sẵn một nhóm kết nối** — thêm một lớp gộp nữa ở
phía Neon chỉ chồng chéo. Chọn direct.

Đổi chuỗi Neon cho ra sang dạng JDBC:

```
jdbc:postgresql://ep-xxx.ap-southeast-1.aws.neon.tech/rims_db?sslmode=require
```

> `?sslmode=require` là **bắt buộc**. Thiếu là Neon từ chối kết nối ngay.

Không phải tạo bảng bằng tay. Lần khởi động đầu, backend tự chạy `schema.sql`
(12 bảng, khoá ngoại, ràng buộc) và `data.sql` (14 bàn, 9 danh mục, 43 món).
Cả hai đều chạy lại được nhiều lần nên khởi động lần sau không lỗi và không ghi
đè dữ liệu đang có.

> **Ảnh món ăn** lưu bằng đường dẫn URL, không lưu tệp. Không cần bật object
> storage của Neon.

---

## Bước 2 — Gửi email qua Brevo

Ứng dụng gửi OTP quên mật khẩu qua **HTTP API của Brevo**, không qua SMTP.

> **Vì sao không dùng Gmail/SMTP.** Nhiều nền tảng lưu trữ chặn traffic đi ra ở
> cổng 25, 465 và 587 để máy chủ của họ không bị dùng phát tán thư rác — Render
> chặn trên gói miễn phí. Ở đó `JavaMailSender` không phải chạy chậm mà **không
> bao giờ kết nối được**, và hỏng đúng luồng quên mật khẩu. Brevo đi qua HTTPS
> cổng 443 nên không vướng.
>
> Dự án cố ý **không** giữ đường SMTP dự phòng: hai đường nghĩa là test ở máy
> một đường rồi deploy bằng đường khác, và luồng thật sự chạy trên máy chủ lại
> là luồng chưa ai thử.

1. Đăng ký Brevo. Gói miễn phí **300 thư/ngày**.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender.** Điền tên và
   địa chỉ email, rồi bấm xác minh trong hộp thư. Phải thấy trạng thái
   **Verified** mới dùng được.
   - Không cần sở hữu tên miền riêng. Một địa chỉ Gmail là đủ.
3. **SMTP & API → API Keys → Generate a new API key.** Copy ngay, Brevo chỉ
   hiện một lần.

Giữ lại hai giá trị: **API key** và **địa chỉ người gửi đã xác minh**.

---

## Bước 3 — VNPay sandbox

Đăng ký tài khoản merchant thử nghiệm ở <https://sandbox.vnpayment.vn>, lấy
**`vnp_TmnCode`** và **`vnp_HashSecret`**.

Chưa cần khai địa chỉ trả về ở bước này — phải có URL của Render trước đã, sẽ
quay lại ở bước 5.

> Bỏ qua bước này cũng deploy được, chỉ là luồng thanh toán bằng mã QR sẽ không
> chạy. Thu tiền mặt vẫn bình thường.

---

## Bước 4 — Dựng dịch vụ trên Render

**New → Web Service → Build and deploy from a Git repository**, chọn repo của
bạn.

| Ô | Điền gì |
| --- | --- |
| **Name** | Tên dịch vụ — quyết định URL `https://<name>.onrender.com` |
| **Language** | **Docker** |
| **Branch** | `main` |
| **Region** | Cùng region với Neon (Singapore) |
| **Root Directory** | *(để trống)* |
| **Dockerfile Path** | `Dockerfile` |
| **Docker Build Context** | `.` |
| **Instance Type** | Free — 0,1 CPU, 512 MB |
| **Docker Command** / **Pre-Deploy** | *(để trống)* |
| **Auto-Deploy** | On Commit |
| **Health Check Path** | ⚠️ **Để trống** |

> **Vì sao Health Check Path phải để trống.** Ứng dụng không có `/healthz`,
> cũng không có Spring Actuator. Nhưng điền `/healthz` vào thì Render vẫn nhận
> **200 OK** — vì `SpaResourceConfig` thấy đường dẫn không có dấu chấm và không
> thuộc `/rims` nên trả về `index.html`. Đó là 200 giả: Render sẽ báo "healthy"
> kể cả khi cơ sở dữ liệu sập hoàn toàn, vì file HTML tĩnh thì lúc nào chẳng đọc
> được.
>
> Để trống thì Render chỉ kiểm cổng có mở không — ít thông tin hơn nhưng thành
> thật. Cũng đừng trỏ vào `/rims/public/restaurant`: mỗi lần kiểm là một truy
> vấn xuống Neon, mà ngân sách compute của Neon là thứ chật nhất trong cả kế
> hoạch này.

**Không cần đặt `SERVER_PORT`** — `Dockerfile` tự nghe theo biến `PORT` mà
Render cấp, và lui về 8080 khi chạy ở máy.

---

## Bước 5 — Biến môi trường

Render cho dán nguyên nội dung file qua ô **Add from .env**. Nhưng `.env` ở máy
**cố ý thiếu vài biến** vì chúng là cấu hình của nơi deploy chứ không phải của
máy phát triển.

### Bắt buộc

| Biến | Giá trị |
| --- | --- |
| `DB_URL` | Chuỗi JDBC của Neon ở bước 1, kèm `?sslmode=require` |
| `DB_USERNAME` | Tên đăng nhập Neon cấp |
| `DB_PASSWORD` | Mật khẩu Neon cấp |
| `JWT_SIGNER_KEY` | **Sinh khoá mới**: `openssl rand -base64 48` |
| `BREVO_API_KEY` | Khoá ở bước 2 |
| `MAIL_FROM_EMAIL` | Địa chỉ đã xác minh ở bước 2 |
| `RIMS_ADMIN_PASSWORD` | Mật khẩu tài khoản quản trị đầu tiên |
| `RIMS_ADMIN_EMAIL` | Email của bạn — đường lấy lại mật khẩu duy nhất |
| `FRONTEND_URL` | `https://<name>.onrender.com` |
| `VNPAY_RETURN_URL` | `https://<name>.onrender.com/rims/cashier/payments/vnpay-callback` |
| `VNPAY_TMN_CODE` | Mã merchant ở bước 3 |
| `VNPAY_HASH_SECRET` | Khoá bí mật ở bước 3 |
| `RIMS_DEFAULT_PASSWORD` | Mật khẩu cấp cho tài khoản mới tạo |

> **`JWT_SIGNER_KEY` phải là khoá mới**, đừng dùng lại khoá của máy phát triển.
> Ai có khoá là tự ký được token giả cho bất kỳ vai nào, kể cả quản trị viên.

> **Hai biến dễ quên nhất là `FRONTEND_URL` và `VNPAY_RETURN_URL`.** Thiếu
> chúng thì app **vẫn chạy** nhưng hỏng âm thầm: CORS cho nhầm origin, và VNPay
> trả khách về `localhost` của chính máy khách.

> **`RIMS_DEFAULT_PASSWORD`** không đặt thì rơi về giá trị mặc định ghi trong
> `application.yaml` — mà ai đọc repo cũng biết.

### Tuỳ chọn

| Biến | Khi nào cần |
| --- | --- |
| `RESTAURANT_NAME`, `RESTAURANT_TAGLINE`, `RESTAURANT_DESCRIPTION`, `RESTAURANT_ADDRESS`, `RESTAURANT_PHONE`, `RESTAURANT_EMAIL` | Nhận diện nhà hàng cho lần khởi động đầu. Sau đó **cơ sở dữ liệu là nguồn thật** — sửa trong màn Cấu hình nhà hàng, đổi biến về sau không ghi đè |
| `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_CONNECTION_TIMEOUT` | Chỉnh nhóm kết nối. Mặc định đã hợp với Neon |

### Đừng đặt

| Biến | Vì sao |
| --- | --- |
| `MAIL_FROM_NAME` | Để trống thì tên người gửi tự lấy theo hồ sơ nhà hàng. Đặt cứng thì đổi tên quán mà thư vẫn ký tên cũ |
| `VITE_API_BASE_URL` | Biến của frontend lúc build ở máy, backend không đọc |
| `SERVER_PORT` | Render tự cấp qua `PORT` |

Sau khi lưu biến, Render tự build lại. Lần build đầu mất khoảng **8–12 phút**.

---

## Bước 6 — Tài khoản đầu tiên

Repo **không chứa tài khoản nào**. Lần khởi động đầu, khi bảng `users` còn rỗng,
app tạo một tài khoản `admin` từ `RIMS_ADMIN_PASSWORD` và `RIMS_ADMIN_EMAIL`.

> Thiếu một trong hai biến trên một cơ sở dữ liệu rỗng thì app **dừng ngay lúc
> khởi động** và nói rõ thiếu biến nào. Cố ý như vậy: hệ thống có quản trị viên
> mà không ai biết mật khẩu thì vô dụng, còn hệ thống tự đặt mật khẩu đoán được
> thì nguy hiểm.

1. Đăng nhập `admin`. Tài khoản mang cờ bắt đổi mật khẩu nên sẽ bị đẩy thẳng
   sang màn đổi mật khẩu.
2. Đổi xong phải **đăng nhập lại** — cờ nằm trong chữ ký của access token nên
   chỉ token mới mới sạch cờ.
3. Tạo nhân viên. Hai cách:

**Cách A** — tự tạo trong màn *Quản lý tài khoản*.

**Cách B** — chạy công cụ seed, trỏ thẳng sang server:

```bash
cd frontend
RIMS_API=https://<name>.onrender.com/rims node tools/seed-demo.mjs <mật-khẩu-admin-mới>
```

Script chỉ dựng **tài khoản và sơ đồ mặt bằng** — không sinh đơn, lượt đặt hay
hoá đơn nào. Tài khoản đã tồn tại thì nó báo 409 rồi đi tiếp, chạy lại được
nhiều lần.

Người nhận tài khoản mới bị bắt đổi mật khẩu ở lần đăng nhập đầu.

> **Lỡ gõ sai `RIMS_ADMIN_EMAIL`?** Biến này bị đóng đinh ở lần khởi động đầu;
> sửa lại biến rồi deploy lại cũng không ăn thua, vì bước tạo admin chỉ chạy khi
> bảng `users` rỗng. Phải `UPDATE` thẳng trong cơ sở dữ liệu.

---

## Bước 7 — Kiểm thử trên bản thật

Bản chạy ở máy **không** thay thế được bước này — xem phụ lục B để biết vì sao.

- [ ] Mở URL. Dịch vụ đang ngủ thì **chờ tới 3 phút**.
- [ ] Đăng nhập từng vai, xem đúng màn của vai đó.
- [ ] **Quên mật khẩu** — phép thử đường Brevo. Nhớ ngó cả hộp Spam.
- [ ] Đặt bàn → gọi món → thanh toán **tiền mặt** → xem hoá đơn.
- [ ] **Tải hoá đơn PDF.** Đáng thử nhất: chỗ này từng hỏng hẳn khi chạy bằng
      jar mà ở máy vẫn chạy ngon.
- [ ] Thanh toán **VNPay** — phải trả đúng về app, không về `localhost`.
- [ ] **Realtime**: hai tab, một vai Bếp một vai Phục vụ. Gọi món ở tab phục vụ,
      màn bếp phải tự nhảy mà không cần F5.
- [ ] **F5 ở màn sâu**: đang ở `/admin/dishes` bấm F5 → phải dựng lại đúng màn.
- [ ] Gọi một API sai, ví dụ `/rims/khong-co-that` → phải trả **JSON 401/404**,
      không phải HTML.
- [ ] Vào **Cấu hình nhà hàng** điền địa chỉ và điện thoại — hoá đơn PDF lấy
      thẳng từ đó, để trống thì hoá đơn chỉ có mỗi tên quán.

---

## Bước 8 — Giữ cho chạy ổn

Gói Free của Render **ngủ sau 15 phút không ai truy cập**. Lúc ngủ, cả 5 tác vụ
nền cũng ngừng:

| Nhịp | Việc |
| --- | --- |
| 60 giây | `autoUpdateTableStatusToReserved` — đánh dấu bàn `RESERVED` khi sắp tới giờ khách đến |
| 60 giây | `autoCancelReservation` — tự huỷ lượt đặt quá hạn |
| 5 phút | `autoUnlockStaleOrders` — mở khoá đơn kẹt ở `LOCKED` |
| 1 giờ | `cleanupStaleCancelledOrders` — dọn đơn bị huỷ sạch món |
| 1 giờ | `cleanupRevokedTokens` — dọn token đã thu hồi |

Vì dùng `fixedRate`, trạng thái hội tụ lại ở nhịp đầu tiên sau khi thức dậy —
mất thời gian thực, **không mất dữ liệu**.

> **Khởi động lạnh mất gần 3 phút, không phải 1 phút.** Log lần deploy đầu ghi
> `Started RimsApplication in 161.098 seconds` — gói Free chỉ có 0,1 CPU. Khách
> mở trang lúc app đang ngủ sẽ đợi chừng đó.

Dựng một cron ngoài ([cron-job.org](https://cron-job.org) hoặc UptimeRobot):

```
URL        https://<name>.onrender.com/rims/public/restaurant
Nhịp       mỗi 10 phút
Khung giờ  07:00 – 20:00
Ngày       tất cả các ngày
```

**Ping đúng đường dẫn trên, đừng ping `/`.** Trang chủ trả `index.html` của
React từ file tĩnh trong jar: 3,5 KB và **không chạm vào cơ sở dữ liệu**, nên
cơ sở dữ liệu chết mà cron vẫn báo 200 OK. `/rims/public/restaurant` trả 344
byte JSON và có đọc thật.

> **Cú ping đầu tiên mỗi sáng sẽ báo lỗi, và như vậy là bình thường.**
> cron-job.org chờ phản hồi tối đa 30 giây, còn khởi động lạnh mất gần 3 phút —
> không đời nào kịp. Nhưng chính cú ping đó đánh thức dịch vụ, nên lần ping sau
> (10 phút sau) sẽ xanh.
>
> Đó là lý do khung giờ bắt đầu lúc **07:00** chứ không phải 07:30: hai cú ping
> đầu dùng để hâm nóng, tới giờ mở cửa là app đã sẵn sàng.
>
> Nhớ **tắt thông báo lỗi** cho job này, hoặc bỏ tuỳ chọn tự vô hiệu hoá khi lỗi
> liên tiếp — nếu không cron-job.org sẽ tự tắt job sau vài sáng.

> ⚠️ **Tuyệt đối đừng ping 24/7.** Neon miễn phí có 100 CU-hours ≈ **400 giờ
> compute/tháng**. Thức 24/7 là 730 giờ — vượt gần gấp đôi, và hết hạn mức thì
> compute bị treo tới đầu tháng sau, app mất cơ sở dữ liệu giữa chừng.
>
> Khung 07:00–20:00 là **13 giờ/ngày ≈ 395 giờ/tháng** — vừa khít, mà cũng đúng
> nhu cầu: hệ thống chỉ nhận đặt bàn trong 08:00–20:00.

Vài ngày đầu ngó **Neon → Usage** xem compute tiêu bao nhiêu.

---

## Phụ lục A — Thử bằng Docker ở máy

Không bắt buộc — Render tự build từ `Dockerfile`. Làm ở máy chỉ để biết sớm nếu
có gì sai, và **đáng làm**, vì vài lỗi chỉ lộ ra khi đóng gói (phụ lục B).

```bash
docker build -t rims .

# Trong container, "localhost" là chính container đó chứ không phải máy bạn —
# phải trỏ qua host.docker.internal mới gặp được PostgreSQL đang chạy ở máy.
docker run --rm -p 8081:8080 --env-file .env \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/rims_db \
  rims
```

Cổng 8081 để không đụng backend dev ở 8080. Ảnh ra khoảng **426 MB**; chạy dưới
giới hạn 512 MB thì dùng ~352 MB sau 200 request nặng, không bị OOM.

**Windows cần WSL2 + Docker Desktop.** Nếu `wsl --install` lỗi
`Wsl/CallMsi/ERROR_FILE_NOT_FOUND` thì bản MSI đăng ký dở dang, sửa bằng:

```bash
winget install --id Microsoft.WSL --force
```

Không cần cài Ubuntu — Docker Desktop dùng distro `docker-desktop` riêng.

> **Thêm thư viện mới mà `npm ci` đứt kiểu `Missing: ... from lock file`?**
> Lockfile sinh trên Windows thiếu gói tuỳ chọn mà Linux cần, mà npm trên
> Windows vẫn coi là "đồng bộ" nên `npm install` ở máy không phát hiện ra. Sinh
> lại lockfile **bên trong container Linux**:
>
> ```bash
> docker run --rm -v "$(pwd)/frontend:/src" node:22-alpine \
>   sh -c 'mkdir /t && cp /src/package*.json /t/ && cd /t \
>   && npm install --package-lock-only && cp package-lock.json /src/'
> ```

> ⚠️ **Đừng dựng PostgreSQL cho dev bằng Docker kèm `restart: unless-stopped`.**
> Mỗi lần bật Docker là container sống dậy, chiếm cổng 5432 và che mất
> PostgreSQL cài sẵn — `localhost:5432` trỏ vào một cơ sở dữ liệu rỗng khác,
> nhìn y như mất sạch dữ liệu.

---

## Phụ lục B — Những lỗi chỉ lộ ra khi deploy

Bốn lỗi tìm được trong quá trình này, đều **không** nhìn thấy khi chạy
`mvn spring-boot:run` ở máy:

| Lỗi | Vì sao chỉ lộ ra lúc deploy |
| --- | --- |
| `npm ci` đứt vì thiếu `@emnapi/*` | Lockfile sinh trên Windows thiếu gói Linux cần; npm trên Windows vẫn báo "đồng bộ" |
| Hoá đơn PDF chết | `fontResource.getFile()` chỉ chạy khi font nằm rời trên đĩa. Đóng thành jar thì font nằm trong jar, không có đường dẫn tệp nào trỏ tới |
| VNPay trả khách về `localhost` | Địa chỉ trả về bị ghi cứng trong mã, biến `VNPAY_RETURN_URL` hoàn toàn vô tác dụng |
| Quản trị viên quên mật khẩu là mất tài khoản | `resetPassword` bảo "dùng chức năng Quên mật khẩu", mà chính luồng đó lại chặn quản trị viên — hai nhánh chỉ sang nhau |

Bài học: **thử bằng jar hoặc bằng container**, đừng chỉ thử bằng
`mvn spring-boot:run`.

---

## Phụ lục C — Hỏng thì xem đâu

| Triệu chứng | Nhiều khả năng là |
| --- | --- |
| Trang trắng, F12 thấy 401 ở `/assets/*.js` | `SecurityConfig` bị sửa thành `.anyRequest().authenticated()` |
| F5 ở màn sâu ra 404 | `SpaResourceConfig` không được nạp, hoặc `dist` chưa vào `resources/static` |
| `Schema-validation: missing table` | `SQL_INIT_MODE` bị đặt thành `never` |
| `connection closed` ở request đầu sau lúc vắng | `max-lifetime` của Hikari bị nới dài hơn ngưỡng Neon cắt kết nối |
| Quên mật khẩu trả 503 | `BREVO_API_KEY` sai, `MAIL_FROM_EMAIL` chưa xác minh, hoặc hết hạn mức 300 thư/ngày. Log ghi nguyên văn lý do Brevo trả về |
| `Invalid CORS request` | `FRONTEND_URL` không khớp URL thật. `CorsConfig` chỉ cho đúng **một** origin |
| App dừng lúc khởi động, log nói thiếu biến | Đúng như log nói — mọi chốt đều in ra tên biến còn thiếu |
| VNPay trả về `localhost` | `VNPAY_RETURN_URL` chưa đặt, hoặc chưa khai lại bên VNPay |
| Email admin sai mà sửa biến không ăn thua | Xem ghi chú ở bước 6 |
| Lượt đặt bàn không tự đổi trạng thái | Dịch vụ đang ngủ — xem bước 8 |
| Build Render lỗi ở `npm ci` | Xem ghi chú lockfile ở phụ lục A |

---

## Phụ lục D — Dọn dữ liệu

Quét sạch phần giao dịch, giữ nguyên tài khoản, bàn, danh mục và món. Thứ tự đã
theo đúng khoá ngoại:

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

Nối vào Neon để chạy:

```bash
psql "postgresql://<user>:<mật-khẩu>@ep-xxx.region.aws.neon.tech/rims_db?sslmode=require"
```

Hoặc dùng thẳng **SQL Editor** trên giao diện web của Neon.
