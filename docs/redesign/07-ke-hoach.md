# Kế hoạch áp hệ "Phiếu bếp" vào code

Nguồn: `design.md` (gốc dự án) · `docs/redesign/00-quyet-dinh.md` · `docs/redesign/06-spec.html`.
Lập 2026-09-27 sau khi đọc code thật, không phải ước lượng.

---

## Điểm tựa: giữ nguyên tên class `rk-*`

| Số liệu | Giá trị |
|---|---|
| File `.tsx` trong `frontend/src` | **79** |
| File dùng class `rk-*` | **61** |
| Class `rk-*` trong `rims-kit.css` | **153** |
| `rims-kit.css` | 3.848 dòng |
| `tokens.css` | 386 dòng · **208 biến** |

**Giữ nguyên tên class, thay ruột.** 61 file đó không phải sửa một dòng nào cho
toàn bộ phần đổi màu, đổi hình khối và đổi mặt chữ. Đây là con đường ít rủi ro nhất
và cho thấy kết quả sớm nhất.

Chỉ sửa `.tsx` khi: đổi icon (P4), đổi vỏ app (P6), đổi khung màn (P7), sửa chữ (P8).

---

## Ba thứ đã đúng sẵn, không phải làm

Đọc code thấy:

1. **Bo góc đã là 0** — `--rims-radius-none/sm/md/lg` đều `0` trong `tokens.css`.
2. **Viền đã là 2px** — `--rims-border: 2px`.
3. **Dây chế độ tối đã nối** — `ThemeProvider` gọi `applyPreference` đặt `data-theme`,
   và `tokens.css` đã có sẵn khối `:root[data-theme='dark']` cùng khối
   `@media (prefers-color-scheme: dark)`.

Nên P5 (chế độ tối) chỉ là **thay giá trị**, không phải dựng hạ tầng.
Thứ thiếu so với hệ mới: **bóng offset cứng** — hiện `--rims-shadow-raised: none`.

---

## Chín pha

Thứ tự này chọn để **pha sớm cho thay đổi nhìn thấy nhiều nhất với diff nhỏ nhất**,
và để mỗi pha đều dừng được giữa chừng mà app vẫn chạy.

---

### P0 · Chuẩn bị — không đổi gì nhìn thấy được

| Việc | File |
|---|---|
| Nạp thêm mặt chữ Archivo + IBM Plex Sans (giữ JetBrains Mono) | `frontend/index.html` |
| Tạo bảng icon và component | `frontend/src/shared/ui/icons.ts` · `Icon.tsx` |
| Tạo bài test canh lệch bộ icon | `frontend/src/shared/ui/icons.test.ts` |

Nguồn có sẵn: `docs/redesign/exports/icons.ts` chép thẳng vào.

**Kiểm:** `npm run build` xanh. Giao diện chưa đổi gì.

---

### P1 · Đổi token — pha cho nhiều thay đổi nhất, diff nhỏ nhất

Viết lại `frontend/src/styles/tokens.css`: **giữ nguyên tên biến, thay giá trị**.

| Biến | Cũ | Mới |
|---|---|---|
| `--rims-paper` | `#f6f7f9` | `#f3f1ea` |
| `--rims-surface` | `#fdfefe` | `#ffffff` |
| `--rims-ink` | `#14181d` | `#111214` |
| `--rims-line` | `#dde1e7` | `#111214` |
| `--rims-brand` | `#1f5fbf` | `#c8271b` |
| `--rims-ok` | `#16704a` | `#12703f` |
| `--rims-busy` | `#8a5a12` | `#a15c00` |
| `--rims-alert` | `#b02532` | `#c8271b` |
| `--rims-shadow-raised` | `none` | `4px 4px 0 var(--rims-ink)` |
| `--rims-font-sans` | Be Vietnam Pro | IBM Plex Sans |
| *(mới)* `--rims-font-display` | — | Archivo |
| *(mới)* `--rims-offset` | — | `4px` · tối `2px` |

Khối `[data-theme='dark']` thay theo bảng đã audit 9/9 — nền `#131313`, mặt `#1b1b1b`,
viền và bóng `#6b6b6b`, bốn màu nghĩa dùng nền tint + chữ màu sáng.

**Chỗ phải cẩn thận:** hệ cũ có `--rims-brand` (xanh dương) **khác** `--rims-alert` (đỏ).
Hệ mới **gộp làm một đỏ**. Phải soát mọi chỗ dùng `--rims-brand` xem nó đang mang nghĩa
"nhận diện" hay "hành động chính" — nếu là hành động chính thì phải đổi sang `--rims-ok`,
vì luật mới là **nút chính luôn lục**.

**Kiểm:** mở app, đi hết 5 vai trò, so với `06-spec.html`. Đo ở 320/375/414/768/1024/1440.

**Rủi ro:** trung bình. Đổi một file, ảnh hưởng toàn app. Dễ hoàn tác.

---

### P2 · Hình khối và nút

`frontend/src/styles/rims-kit.css`:

- `.rk-btn` — thêm `box-shadow: var(--rims-shadow-raised)`, hover lún nửa bóng,
  active lún hết bóng về 0, `90ms linear`.
- **`.rk-btn--sm` và `--lg` chỉ được đổi `font-size` và `padding`.** Không đổi nền,
  viền, bóng, hover, active. *(Đây là lỗi tôi đã mắc trong bản dựng phiếu 05.)*
- `.rk-btn--go` = lục · `.rk-btn--danger` = đỏ **tô đặc, có nền, có bóng, có hover** ·
  `.rk-btn--quiet` = giấy viền mực. Ba vai, hết.
- `.rk-card` · `.rk-statcard` · `.rk-ticket` · `.rk-modal` — thêm bóng cứng.
- `.rk-table` — **tiết chế**: đầu bảng mực đặc, trong lòng kẻ 1px, **không bóng**,
  ô không in hoa. Viền 2px và bóng chỉ ở khung ngoài.
- `.rk-btn[disabled]` — thêm **sọc chéo mờ**, không chỉ nhạt màu.
- `:focus-visible` — vòng 3px màu TIN, `outline-offset: 3px`, không hoạt hoạ.
- `@media (pointer: coarse)` — mọi nút tối thiểu 48px.

**Kiểm:** bấm thử nút ở mọi vai trò, kiểm cả bàn phím Tab.

---

### P3 · Mặt chữ

- `--rims-font-display: Archivo` cho `h1..h6`, nhãn nút, số lớn — **in hoa**.
- `--rims-font-sans: IBM Plex Sans` cho thân.
- Giữ JetBrains Mono cho số và mã.

**Chỗ phải cẩn thận:** đổi mặt chữ làm **đổi chiều rộng chữ**. Nhãn nút tiếng Việt có
dấu dễ vỡ dòng. Soát lại mọi nút ở 320px sau khi đổi.

---

### P4 · Icon — gỡ lucide-react

Đây là pha có **khoảng trống thật phải quyết**, không chỉ là thay hình.

| Số liệu đọc từ code | |
|---|---|
| Icon lucide được import | **45** |
| Icon thật sự được vẽ ra | **36** |
| **Import chết, không ai vẽ** | **9** — `Sun` `Moon` `MapPin` `Phone` `Monitor` `MessageSquare` `Image` `Crown` `RotateCcw` |
| File có dùng lucide | **39** |
| Bộ icon mới trong spec | **30** |

**Khoảng trống:** 36 icon đang vẽ so với 30 icon trong spec. Chênh lệch nằm ở những
icon spec cố ý **không vẽ** — món ăn (`Soup` `Utensils` `UtensilsCrossed`), tiền
(`Wallet` `Coins`), phương thức trả (`QrCode`), thành tích (`Trophy` `Crown`), và
vài cái spec chưa tính (`Eye`/`EyeOff` cho ô mật khẩu, `Download` cho PDF,
`Bell` cho chuông báo bếp, `LogOut`, `KeyRound`, `Globe`, `Store`, `Info`).

→ **Cần một buổi chốt bổ sung**: mỗi icon trong 36 cái đó đi về đâu — ánh xạ sang
một trong 30, thay bằng chữ, hay thêm vào bộ. Luật *"một nghĩa một icon"* buộc phải
làm bước này tử tế, không ánh xạ bừa.

Sau khi chốt: đổi 39 file, gỡ `lucide-react` khỏi `package.json`, bật bài test.

**9 import chết** là thứ bài test *"icon không ai dùng"* sẽ bắt ngay — xoá luôn ở pha này.

---

### P5 · Chế độ tối

Hạ tầng đã có. Chỉ thay giá trị trong khối `[data-theme='dark']` và thêm luật
**nút và chip là nền tint + viền màu + chữ màu**, bóng `2px`.

**Chỗ phải cẩn thận:** khối `@media (prefers-color-scheme: dark)` hiện có
`:root:not([data-theme='light'])`. Giữ nguyên cấu trúc đó, chỉ thay giá trị.

**Kiểm:** bật tắt chế độ ở cả 5 vai trò, đối chiếu `06-spec.html` ở chế độ tối.

---

### P6 · Vỏ app

| File | Đổi gì |
|---|---|
| `shared/components/layout/Sidebar.tsx` | Thành **rail 4.6rem**: icon + nhãn chữ nhỏ bên dưới |
| `shared/components/layout/DashboardTopbar.tsx` | Thành **hàng breadcrumb + đồng hồ + icon ca + nút sáng/tối**. **Bỏ tên người dùng** |
| `shared/components/layout/DashboardLayout.tsx` | Xếp lại: rail dọc · hàng breadcrumb · băng mục con · nội dung |
| `app/config/roleMenus.tsx` | Thêm **tên icon** cho từng mục; gộp **10 mục Quản trị thành 4 nhóm** |
| *(mới)* băng mục con | Chỉ hiện ở Quản trị, nằm **dưới** hàng breadcrumb |

**Chỗ phải cẩn thận:** dưới 60rem rail thu thành **ngăn kéo**. Trạng thái mở/đóng,
đóng bằng Esc, focus trả về nút đã mở.

---

### P7 · Khung màn — pha to nhất

Theo bảng phân công trong `design.md § Bản đồ 37 màn`. Chia nhỏ, làm từng nhóm:

| Nhóm | Màn | Việc |
|---|---|---|
| 7a | `KitchenQueuePage` `ChefDashboardPage` `GroupedKitchenPage` `CashierPaymentsPage` | **Kanban ba cột trạng thái**; dưới 52rem thành một cột + băng tab có số đếm |
| 7b | `AdminDishesPage` `AdminCategoryPage` `AdminMenuDashboardPage` | **Cặp nút Thẻ / Bảng**, mặc định thẻ, nhớ theo người dùng |
| 7c | `WaiterCreateOrderPage` `WaiterUpdateOrderPage` | Lưới ảnh món to + **giỏ đơn cột dính bên phải** |
| 7d | `HomePage` | Danh mục dính + lưới ảnh · **băng ảnh tự cuộn 40s** có nút dừng · **ô đăng nhập động ở góc** |
| 7e | `WaiterTableListPage` | **Sơ đồ mặt bằng** — phụ thuộc P9, làm sau |
| 7f | Còn lại | Bảng dày + lọc · biểu mẫu ≤46rem · màn kết quả |

**7d chạm routing:** ô đăng nhập trong HomePage nhưng **vẫn giữ route `/login`** để
chuyển hướng khi hết hạn token. Không được bỏ route.

---

### P8 · Giọng văn — 8 nhóm, máy móc nhưng phải soát tay

| Sửa | Số chỗ |
|---|---|
| `hủy` → `huỷ` | 27 |
| `xóa` → `xoá` | 9 |
| `…` → `...` | 83 |
| `Tình trạng` → `Trạng thái` | 1 |
| Bỏ `"thành công!"`, chỉ giữ ở màn thanh toán | 9 |
| `Sửa Đặt Bàn` → `Sửa đặt bàn` | 1 |
| **Bốn tên QR** → `Mã QR` | 7 |
| Nhãn nút về dạng **động từ + tân ngữ** | soát tay |

**Không dùng tìm-thay mù.** `hủy`/`huỷ` nằm cả trong tên biến và chuỗi hiển thị —
chỉ đổi **chuỗi hiển thị**, không đổi tên hàm hay khoá i18n.

---

### P9 · Backend — ngoài giao diện, phải tính riêng

1. Thêm `x, y, w, h, zone` cho bàn trong `schema.sql` + API lưu mặt bằng
2. **Màn thứ 37**: Quản trị kéo thả vẽ mặt bằng
3. Phóng hai ngón cho mặt bằng ở khung hẹp

Kéo thả trên cảm ứng phải **tự viết** — dự án motion-cut, không cài thư viện.
Đây là phần tốn công nhất của cả bản thiết kế lại.

---

## Thứ tự đề xuất và lý do

| Đợt | Pha | Vì sao |
|---|---|---|
| **1** | P0 + P1 | Đổi màu toàn app bằng **một file**. Thấy kết quả ngay, hoàn tác dễ |
| **2** | P2 + P3 | Hình khối và mặt chữ — vẫn chỉ trong `rims-kit.css` và `tokens.css` |
| **3** | P5 | Chế độ tối — hạ tầng có sẵn, chỉ thay giá trị |
| **4** | P4 | Icon — cần **chốt ánh xạ 36 → 30** trước khi đổi 39 file |
| **5** | P6 | Vỏ app — bắt đầu chạm `.tsx` nhiều |
| **6** | P8 | Giọng văn — máy móc, làm lúc nào cũng được, nên xen vào đây |
| **7** | P7a–7d, 7f | Khung màn, chia nhỏ từng nhóm |
| **8** | P9 rồi P7e | Backend trước, sơ đồ mặt bằng sau |

---

## Kiểm sau mỗi pha

1. `npm run build` xanh, `npm run test` xanh
2. Đi hết **5 vai trò**, không màn nào vỡ
3. Đo ở **320 / 375 / 414 / 768 / 1024 / 1440**
4. Bật tắt **chế độ tối**
5. Đi bằng **bàn phím**: Tab thấy vòng focus ở mọi nút, Esc đóng được lớp nổi
6. Đối chiếu với `06-spec.html`

---

### P10 · Render walk từng màn

Sau khi code xong, **mở từng màn và đối chiếu với `06-spec.html`**. Không phải chạy
build xanh là xong — build xanh vẫn có thể ra một màn xấu.

Đi đủ **5 vai trò × cả hai chế độ sáng tối**, mỗi màn kiểm:
bo góc 0 · viền 2px · bóng lệch đúng chiều · nút chính là lục và chỉ có một ·
chip đúng màu và có ký hiệu · không quá 3 màu một khung nhìn · chữ không vỡ dòng ·
vòng focus thấy được. Chỗ nào lệch thì sửa ngay tại chỗ, không để dồn.

### P11 · Gom tài liệu — làm SAU CÙNG

Chỉ làm khi code đã ổn thoả:

1. Dựng **`design.html`** — mở lên là hiểu ngay, không phải đọc văn bản.
   Nguồn: `06-spec.html` đã có sẵn, nâng lên thành tài liệu chính thức của dự án.
2. **`design.md` trỏ sang `design.html`** — giữ phần luật dạng chữ cho ai muốn đọc
   nhanh hoặc cho công cụ đọc, nhưng nói rõ bản đầy đủ nằm ở `design.html`.
3. **Xoá toàn bộ bản ghi trong `docs/redesign`** — bảy phiếu phỏng vấn và sổ chốt
   đã hết việc khi hệ đã vào code.
4. Sửa lại các **tài liệu mô tả khác trong `docs/`** cho khớp hệ mới.

---

## Commit

**Vừa làm vừa commit**, mỗi pha một commit, thông điệp tiếng Việt theo lối đang có
trong repo (`feat:` · `fix:` · `docs:` · `style:`). Không gộp nhiều pha vào một commit —
để hoàn tác được từng pha.

---

## Việc cần bạn quyết trước khi làm P4

**Ánh xạ 36 icon lucide đang dùng → bộ 30 icon mới.** Tôi sẽ soạn bảng đề xuất
từng cái một, nhưng luật *"một nghĩa một icon"* nghĩa là có những cái phải
**bỏ icon, dùng chữ** — và đó là quyết định của bạn, không phải của tôi.
