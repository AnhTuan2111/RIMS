# Design — RIMS

Hệ thiết kế đã khoá cho toàn bộ ứng dụng. Mọi lần thiết kế lại một màn đều đọc
file này trước khi viết code. Không sinh lại theo từng màn — cần mở rộng thì sửa
chính file này.

Tên gọi nội bộ của hệ: **Phiếu bếp**.

> File này thay hệ cũ ("Thép" + "Đậm & nét"). Nguồn quyết định:
> `docs/redesign/00-quyet-dinh.md` — 7 phiếu phỏng vấn, chốt 2026-09-27.

---

## Genre

**neo-brutalist POS, retro.** Phần mềm vận hành nhà hàng, dùng trong ca, trên cả
tablet cảm ứng, laptop và điện thoại.

Chữ ký: **bo góc 0px tuyệt đối** · **viền 2px** · **bóng offset cứng blur 0** ·
**hover lún vào bóng của chính nó** · **nhãn in hoa Archivo** · **màu mang nghĩa**.

Tham chiếu đã đọc và trích luật: retro-brutalist UI 2026 (setproduct),
neo-brutalism web design (theplusaddons). Hai bài đó cảnh báo style này **tệ với
bảng dữ liệu dày** — RIMS có 11 màn quản trị toàn bảng, nên có luật tiết chế riêng
ở § Bảng.

### Điều KHÔNG áp dụng từ tham chiếu, kèm lý do

- `-webkit-font-smoothing: none` — **không dùng.** Giao diện toàn tiếng Việt, tắt
  làm mịn làm vỡ dấu ở cỡ nhỏ.
- Palette chroma cao (lime, hồng, cyan) — **không dùng.** Đã chọn bốn màu đậm chữ
  trắng để nhìn được cả ca 8 tiếng.

---

## Bốn màu nghĩa

Màu **là** nghĩa. Dùng màu không mang nghĩa là sai luật.

| Vai | Sáng | Tối (nền tint / chữ) | Nghĩa |
|---|---|---|---|
| **LÀM** | `#12703f` | `#167a46` / `#16281d` · `#5fd08e` | xong · lưu · thanh toán · bàn trống |
| **BỎ** | `#c8271b` | `#c8271b` / `#2b1512` · `#ff8a72` | huỷ · xoá · lỗi · quá hạn |
| **CHỜ** | `#a15c00` | `#a15c00` / `#2a1f0b` · `#ffc94a` | đang nấu · đang phục vụ · cần chú ý |
| **TIN** | `#1b5fbf` | `#2069c9` / `#141c2e` · `#7aaaff` | đã đặt trước · chờ thanh toán |

**Một đỏ duy nhất.** `#c8271b` kiêm cả màu thương hiệu. Phân biệt bằng **vị trí**:
ở vỏ app (rail đang mở, băng mục con) nó là nhận diện; trên nút nó là phá huỷ.

### Sáu luật màu

1. **Không màu nào được dùng để trang trí** — trừ trang công khai, và ở đó cũng
   không được dùng bốn màu nghĩa.
2. **Tối đa 3 màu một khung nhìn**, chưa kể mực và giấy. Chip xám (thuộc tính:
   ca, phương thức trả, danh mục, số chỗ) không tính.
3. **Nút chính LUÔN là lục**, mọi màn, bất kể màn làm gì. Một màn đúng một nút lục.
4. **Trạng thái không bao giờ chỉ mang màu** — mọi chip đều có chữ và ký hiệu.
5. **Hổ phách không dùng cho nút.** Chỉ dành cho trạng thái chờ.
6. Chế độ tối **giữ nguyên hue**, chỉ nâng độ sáng vừa đủ đạt 3:1. Không có bộ màu
   thứ hai.

### Audit

Đo bằng công thức WCAG, không phỏng. Sàn: **4.5:1** chữ · **3.0:1** khối và viền.

- **Chế độ sáng: 29/29 cặp đạt.**
- **Chế độ tối: 9/9 cặp đạt** — mực/mặt 14.58 · mực phụ 9.17 · viền/mặt 3.23 ·
  viền/nền 3.49 · nút chính 8.04 và 8.94 · nút huỷ 7.49 · chip chờ 10.55 và 11.24.

---

## Chế độ tối

Ba luật, rút từ theme `qlcv-aura` của dự án kpi-manage. Đây là **kỹ thuật**, không
phải cái vẻ — hình khối, mặt chữ và bóng của RIMS giữ nguyên.

1. **Viền và bóng là trung tính VỪA** (`#6b6b6b`), **không bao giờ trắng.** Viền
   trắng + bóng trắng trên nền gần-đen làm mỗi nút thành một miếng sticker dán.
2. **Chip và nút là nền tint tối + chữ màu sáng**, không tô đặc cả khối màu rực.
3. **Bóng nhẹ hơn bản sáng: 2px** thay vì 4px.

**Luật nền tảng, đo được:** không sắc tối nào tách nổi 3:1 khỏi một nền tối
(mặt `#1b1b1b` vs nền `#131313` = **1.08**). Nên ở chế độ tối **cấu trúc do đường
kẻ tạo ra, không do nền**.

**Hệ quả:** ở chế độ tối mọi nút đều là nền tint, nên **không có nút nào "tô đặc"**.
Nút chính phân biệt bằng **màu viền và màu chữ là lục**, và luật "một màn đúng một
nút lục" vẫn đủ để nó là thứ duy nhất mang lục.

Phạm vi: **cả 37 màn**. Đổi chế độ bằng **nút trên hàng breadcrumb**, nhớ theo
từng người dùng.

---

## Typography

| Vai | Mặt chữ | Cân nặng |
|---|---|---|
| Display | Archivo | 700 · 800, **IN HOA** |
| Thân | IBM Plex Sans | 400 · 500 · 600 |
| Số & mã | JetBrains Mono | 400 · 500 · 700 |

**Ràng buộc cứng: giao diện toàn tiếng Việt, mặt chữ phải đủ dấu.** Cả ba đều có
subset `vietnamese`. Đã loại Berkeley Mono và Departure Mono (hai bài tham chiếu
gợi ý) vì không có dấu tiếng Việt.

- Display roman, **không bao giờ nghiêng**.
- Mọi số trong bảng, tiền, giờ, mã đơn: `font-variant-numeric: tabular-nums`.
- Chữ nét đôi (`-webkit-text-stroke` + `text-shadow`) **chỉ dùng từ 24px trở lên** —
  dưới đó nét viền 2px ăn mất dấu.
- **Tiếng Việt không dùng Title Case.** Chỉ hoa chữ đầu câu. Nhãn nút in hoa toàn
  bộ là do `text-transform`, không viết hoa trong chuỗi.

---

## Hình khối

- **Bo góc 0px cho MỌI THỨ.** Ngoại lệ duy nhất: **radio tròn** — quy ước quá mạnh
  để phá.
- **Viền 2px** cho bề mặt và điều khiển; **1px** cho kẻ trong lòng bảng và viền chip.
- **Bóng offset cứng, blur 0.** Sáng 4px, tối 2px.
- **Bóng chỉ ở: thẻ · nút · modal · phiếu · ô thống kê.** Không bao giờ đổ bóng
  trong lòng bảng, trên hàng danh sách, hay trên ô nhập.
- **Không dùng vạch trái đậm một cạnh** (side-stripe card) — anti-pattern.

---

## Nút

**Mọi nút cùng một khuôn. Nghĩa nằm ở màu.**

App hiện có **đúng ba vai nút**, đọc từ code:

| Màu | Class hiện tại | Nghĩa | Nhãn thật trong app |
|---|---|---|---|
| Lục tô đặc | `rk-btn--go` | LÀM | Xong món · Thanh toán |
| Đỏ tô đặc | `rk-btn--danger` | PHÁ | Hủy món |
| Giấy, viền mực | `rk-btn--quiet` | phụ | Làm mới · Quay lại · Xoá bộ lọc · Tìm |

Token có sẵn biến thể **mực tô đặc** nhưng **chưa có hành động thật nào cần nó**.
Không dùng cho tới khi xuất hiện một hành động quan trọng mà không phải làm cũng
không phải phá. Bản nháp trước của file này liệt kê "Chốt đơn" và "Để sau" —
**cả hai đều không tồn tại trong app** và đã bị gỡ.

**Biến thể kích cỡ (`--sm`, `--lg`) CHỈ được đổi cỡ chữ và đệm trong.** Không được
đổi nền, viền, bóng, hành vi hover hay active. Nút huỷ cỡ nhỏ nhất trong hàng bảng
vẫn có nền, viền 2px, bóng lệch, và lún vào bóng khi bấm — giống hệt nút chính.

**Giảm bấm nhầm:** nút phá huỷ đặt cách nút chính **tối thiểu 24px**, và việc
không đảo được thì phải qua hộp thoại xác nhận.

### Tám trạng thái, bắt buộc có đủ

`default` · `hover` · `focus-visible` · `active` · `disabled` · `loading` ·
`error` · `success`

- **hover**: lún nửa khoảng bóng. **active**: lún hết, bóng về 0. `90ms`, `linear`.
- **disabled**: nền xám, viền xám, **thêm sọc chéo mờ** — không chỉ nhạt màu.
- **focus**: vòng `3px` màu TIN, `outline-offset: 3px`, **hiện tức thì, không hoạt hoạ**.
  Viền 2px dễ ăn mất vòng focus nên vòng phải nằm ngoài.
- **loading**: giữ nhãn cũ, đổi sang thể tiếp diễn, thêm vòng xoay, `aria-busy="true"`.
- `@media (pointer: coarse)` nâng mọi nút lên **tối thiểu 48px**.

---

## Chip trạng thái

**Tô đặc màu trạng thái + chữ + ký hiệu riêng.** Ký hiệu gán **theo nghĩa của
trạng thái**, không theo màu — vì `✓` cho "bàn trống" là sai nghĩa.

13 trạng thái thật, lấy từ 4 enum trong `backend/.../enums`:

| Enum · giá trị | Nhãn | Màu | Ký hiệu |
|---|---|---|---|
| `TableStatus.AVAILABLE` | Bàn trống | LÀM | `○` |
| `TableStatus.RESERVED` | Đã đặt trước | TIN | `★` |
| `TableStatus.SERVING` | Đang phục vụ | CHỜ | `●` |
| `OrderStatus.SERVING` | Đang phục vụ | CHỜ | `●` |
| `OrderStatus.LOCKED` | Chờ thanh toán | TIN | `₫` |
| `OrderStatus.COMPLETED` | Đã thanh toán | LÀM | `✓` |
| `OrderItemStatus.PREPARING` | Đang chế biến | CHỜ | `...` |
| `OrderItemStatus.COMPLETED` | Đã xong | LÀM | `✓` |
| `OrderItemStatus.CANCELLED` | Đã huỷ | BỎ | `✕` |
| `ReservationStatus.QUEUED` | Chưa tới giờ | TIN | `▸` |
| `ReservationStatus.WAITING` | Đang tới giờ | CHỜ | `▲` |
| `ReservationStatus.COMPLETED` | Đã nhận bàn | LÀM | `✓` |
| `ReservationStatus.CANCELLED` | Đã huỷ | BỎ | `✕` |

**Chip xám cho thuộc tính, không phải trạng thái:** `PaymentMethod`, `OrderShift`,
danh mục, số chỗ, khu. Chúng **không tiêu ngân sách 3 màu**.

**`TableStatus` chỉ có đúng ba giá trị** — `AVAILABLE · SERVING · RESERVED`.
Không có "đang dọn", không có "bảo trì". Đừng vẽ thẻ bàn cho trạng thái không tồn tại.

**Chip không dùng icon** — ký hiệu chữ là đủ, và giữ cho `check` chỉ có một nghĩa.

---

## Bảng — luật tiết chế

Đây là chỗ hai bài tham chiếu cảnh báo style này làm dở. Cách xử lý:

- Đầu bảng: **thanh mực đặc**, chữ in hoa mono.
- Trong lòng bảng: **kẻ mảnh 1px**, **không bóng**, **ô không in hoa**.
- Viền 2px và bóng cứng **chỉ ở khung ngoài**.
- Hàng rê chuột: đổi nền sang `--rims-surface-2`, **không dùng màu**.
- Bảng rộng hơn khung: hộp cuộn ngang có `tabindex="0"` để cuộn được bằng bàn phím.
- Ở 320px: **cuộn ngang**, không biến hàng thành thẻ.

---

## Chiều rộng theo loại nội dung

| Loại | Giới hạn |
|---|---|
| Bảng · kanban · sơ đồ mặt bằng | **giãn hết màn**, không giới hạn |
| Biểu mẫu | tối đa **46rem** |
| Văn bản đọc | tối đa **68 ký tự** |
| Lưới ảnh món | cột **không nhỏ hơn 15rem** — màn rộng thì **ảnh to hơn**, không phải nhiều cột hơn |

---

## Vỏ app

- **Rail 4.6rem** dọc bên trái: icon một nét + nhãn chữ nhỏ bên dưới. Không có slab
  đen ngang.
- **Hàng đầu vùng nội dung**: breadcrumb + đồng hồ + icon ca + nút đổi sáng/tối.
  **Không hiện tên người dùng.**
- **Băng mục con ngang** nằm **dưới** hàng breadcrumb — chỉ xuất hiện ở Quản trị,
  cho 4 nhóm × mục con.
- Dưới 60rem: rail thu thành **ngăn kéo** mở bằng nút trên hàng breadcrumb; băng
  mục con cuộn ngang.
- Quản trị gộp **10 mục thành 4 nhóm**: Bán hàng · Thực đơn · Tài khoản · Cấu hình.

---

## Microinteractions

- **Thành công thì im lặng.** Lưu xong thì dữ liệu đổi tại chỗ. Chữ "thành công!"
  **chỉ còn ở màn kết quả thanh toán**.
- **Việc đảo được: làm ngay + toast có Hoàn tác**, không hỏi lại. Hộp thoại xác
  nhận chỉ dành cho việc không đảo được.
- Toast ở **góc trên phải**, xếp chồng xuống. Toast có Hoàn tác sống ít nhất 10s
  và không tự mất khi đang rê chuột vào.
- Toast chỉ dành cho việc xảy ra **ngoài tầm mắt** — bếp báo món xong, bàn đổi
  trạng thái do người khác.
- Tooltip: rê chuột chờ 800ms, focus bàn phím hiện 0ms. **Không bao giờ chứa thông
  tin duy nhất** — tablet không có trạng thái rê chuột.
- Băng ảnh và băng chữ chạy: có nút dừng, dừng khi rê chuột, dừng khi focus bàn
  phím, và **đứng yên ngay từ đầu** nếu hệ thống bật `prefers-reduced-motion`.

---

## Sáu thủ pháp retro — bảng cho phép

| Thủ pháp | Công khai | Vận hành | Quản trị | Tốn màu? |
|---|---|---|---|---|
| Sọc kẻ chéo | được | **được** — nút vô hiệu, trạng thái rỗng, vùng chưa có dữ liệu | được | không |
| Chữ nét đôi | **được** — tiêu đề lớn | chỉ màn kết quả thanh toán | không | 1 màu |
| Số kiểu bảng tỉ số | được | **được** — ô thống kê, số bàn, đồng hồ | **được** | không |
| Chấm halftone | **được** — dải khối lớn | không | không | 1 màu |
| Tia starburst | **được** — tối đa 1 cái/màn | không | không | 1 màu |
| Băng chữ chạy | được | **được** — thông báo ca, món hết, bếp nghẽn | không | không |

Màn vận hành chỉ dùng ba thủ pháp **không tốn màu nào** — để dành toàn bộ ngân
sách 3 màu cho trạng thái.

---

## Icon

30 icon. Cơ chế học từ theme `qlcv-aura`: **một bảng hằng `ICONS`**, mỗi icon chỉ
là chuỗi `<path>`; **một component `<Icon name>`**; `viewBox="0 0 24 24"`;
`aria-hidden="true"`; **độ dày nét đặt một lần ở class `.rims-i`**, không viết
trong từng icon. Tên khoá camelCase tiếng Anh, ngắn, ổn định.

Hình học **vuông hoá**: `rx = 0`, không vòng tròn, đầu nét vuông, góc miter,
nét **2** — cùng cây bút với viền 2px.

### Luật gốc

**MỘT NGHĨA MỘT ICON, MỘT ICON MỘT NGHĨA.**

Khi một icon mới cần một nghĩa đã bị chiếm, icon cũ phải **bị thu hẹp nghĩa** và
việc đó phải được **viết xuống trong comment** ngay tại `icons.ts`.

Bốn chỗ trùng nghĩa của RIMS đã gỡ:

1. `table` giữ nghĩa **bàn ăn**; chế độ xem thẻ dùng `cards` (hai dải ngang)
2. `ticket` **có khung**; `rows` **không khung**, chỉ bốn vạch trần
3. `check` chỉ cho **nút và hộp kiểm**; chip trạng thái dùng ký hiệu chữ
4. `ban` = **huỷ** · `x` = **đóng** (đã thu hẹp) · `trash` = **xoá**

> **Vì sao 30 mà không phải 29** — con số 29 ở phiếu 05 tính trước khi gỡ trùng nghĩa.
> Việc thu hẹp `x` xuống đúng nghĩa **đóng** đã tách nó ra khỏi `ban` (huỷ), nên bộ tăng
> thêm một icon. Đó là cái giá đúng của luật "một nghĩa một icon".

### Không vẽ icon cho

- **Trạng thái** — đã có ký hiệu chữ riêng
- **Món ăn** — đã có 43 ảnh thật trong `frontend/public/image`
- **Phương thức trả** — "Tiền mặt" và "Mã QR" là chip chữ, rõ hơn icon
- **Thống kê** — ô số kiểu bảng tỉ số đã đủ

### Bài test bắt buộc

1. Mọi khoá trong `ICONS` phải có trong `ICON_MEANING` và ngược lại — bắt icon mồ côi.
2. Mọi icon phải được dùng **ít nhất một chỗ** trong code — bắt icon không ai dùng.

---

## Giọng văn

- **Nhãn nút: động từ + tân ngữ ngắn.** "Xong món", "Huỷ món", "Lưu đặt bàn",
  "Thanh toán". Không dùng động từ đơn — "Huỷ" một chữ tối nghĩa vì nó dùng cho
  ba việc khác nhau.
- **Thông báo lỗi ba phần:** chuyện gì xảy ra · **dữ liệu của bạn còn hay mất** ·
  làm gì tiếp. Câu giữa hay bị bỏ nhất mà lại là câu người dùng lo nhất.
- **Không gọi người dùng.** Câu không chủ ngữ: "Phiếu vẫn được giữ".
- **Chính tả: `huỷ`** (không phải `hủy`).
- **Dấu ba chấm: `...`** ba dấu chấm (không phải `…`).
- **`Trạng thái`**, không dùng `Tình trạng`.
- **Ngày giờ: `27/09 19:42`** — bỏ năm nếu là năm nay.
- **Tiền:** `485.000 ₫` đầy đủ ở bảng, hoá đơn, tổng tiền, màn thanh toán.
  `485K` ở thẻ bàn, thẻ món, chip, băng ảnh, ô thống kê, phiếu bếp.
  Ngưỡng rút gọn: từ 1.000. Triệu: `18,4tr` ở ô thống kê, `18.400.000 ₫` ở bảng.

### Nhãn nút thật trong app — dùng đúng những chữ này

`Xong món` · `Thanh toán` · `Hủy món` (sẽ thành `Huỷ món`) · `Làm mới` ·
`Quay lại` · `Xoá bộ lọc` · `Tìm` · `PDF` · `Bật âm thanh`.

Không bịa nhãn mới. Cần một hành động chưa có thì thêm vào đây trước, rồi mới vẽ.

### Bảng từ vựng — một nghĩa một từ

| Khái niệm | Từ dùng | Icon | Không dùng |
|---|---|---|---|
| Một lần khách gọi món | **đơn** | `ticket` | order · bill |
| Giấy bếp nhận để nấu | **phiếu** | `ticket` | vé · đơn bếp |
| Chứng từ sau khi trả tiền | **hoá đơn** | `invoice` | bill · biên lai |
| Khách giữ chỗ trước | **đặt bàn** | `booking` | reservation · đặt chỗ |
| Một thứ trong thực đơn | **món** | — ảnh thật | sản phẩm · mặt hàng |
| Nhóm món | **danh mục** | `kitchen` | loại · phân loại |
| Tình trạng bản ghi | **trạng thái** | — ký hiệu chữ | tình trạng |
| Khoảng giờ làm | **ca** | `sun` / `moon` | kíp · phiên |
| Người phục vụ bàn | **phục vụ** | `user` | bồi bàn · waiter |
| Bỏ việc đang dở | **huỷ** | `ban` | xoá · bỏ |
| Bỏ bản ghi khỏi hệ thống | **xoá** | `trash` | huỷ · gỡ |
| Đóng lớp nổi | **đóng** | `x` | huỷ · thoát |
| Bếp làm xong một món | **xong món** | `check` | hoàn thành · hoàn tất |

---

## Responsive

Mobile-first, không ngoại lệ.

- Base style viết cho khung hẹp nhất. Chỉ dùng `min-width`.
- Điểm ngắt bằng `rem`: `30rem` · `48rem` · `52rem` · `60rem` · `90rem`.
- `html` và `body` mang `overflow-x: clip`, **không phải `hidden`** — `hidden` phá
  `position: sticky`.
- Chiều cao dùng `dvh`, không dùng `vh`.
- Track lưới chứa ảnh dùng `minmax(0, 1fr)` hoặc `minmax(min(Npx, 100%), 1fr)`.
- `@media (pointer: coarse)` nâng mọi vùng chạm lên **tối thiểu 48px**.
- Nhãn bấm được không bao giờ xuống hai dòng: `white-space: nowrap`.
- Hàng bộ lọc và hàng chip luôn `flex-wrap: wrap`.
- Kanban ba cột: **dưới 52rem** thành một cột + băng tab trạng thái có số đếm.
- Sơ đồ mặt bằng: giữ mặt bằng, thu nhỏ và **phóng to hai ngón**.

Đo lại ở **320 / 375 / 414 / 768 / 1024 / 1440** sau mỗi lần sửa.

---

## Bản đồ 37 màn

| Nhóm màn | Khung |
|---|---|
| `HomePage` | Danh mục dính + lưới ảnh · băng ảnh tự cuộn 40s có nút dừng · **ô đăng nhập động ở góc** (route `/login` vẫn giữ) |
| `LoginPage` · `RegisterPage` · `ForgotPassword` · `ForceChangePassword` | Biểu mẫu ≤46rem |
| `CustomerReservations` | **Y hệt luồng đặt bàn của Phục vụ** |
| `WaiterTableListPage` | **Sơ đồ mặt bằng thật** (toạ độ `x,y,w,h,zone` trong DB) |
| `WaiterCreateOrderPage` · `WaiterUpdateOrderPage` | **Giống thực đơn**: lưới ảnh món to + **giỏ đơn là cột dính bên phải** |
| `WaiterOrderDetailPage` · `WaiterReservationDetailPage` | Một bản ghi, phiếu dọc, hành động trên phiếu |
| `WaiterCreateReservationPage` · `WaiterEditReservationPage` | Biểu mẫu ≤46rem |
| `KitchenQueuePage` · `ChefDashboardPage` · `GroupedKitchenPage` | **Kanban ba cột trạng thái** |
| `CashierPaymentsPage` | **Kanban ba cột**: Chờ trả · Đang xử lý · Đã trả |
| `CompletedOrdersPage` · `CancelledOrdersPage` · `CashierInvoicesPage` | Bảng dày + lọc |
| `PaymentSuccess` · `PaymentFailed` | Một khối lớn giữa màn — chỗ duy nhất dùng chữ nét đôi ở họ vận hành |
| `DishListPage` | Lưới thẻ ảnh, chỉ đọc |
| `AdminDishesPage` · `AdminCategoryPage` · `AdminMenuDashboardPage` | Thẻ ảnh, **đổi được sang bảng**, mặc định thẻ, nhớ theo người dùng |
| `AdminUsersPage` · `AdminTablesPage` · `AdminRestaurantPage` | Danh sách + biểu mẫu cạnh nhau |
| `AdminPaymentHistoryPage` · `AdminPaymentDetailPage` | Bảng dày + rail lọc |
| `AdminStatisticsPage` · `RevenueOverviewPanel` | Dải số to + biểu đồ + bảng |
| `ProfilePage` | Biểu mẫu ≤46rem |
| **MỚI — màn thứ 37** | **Quản trị vẽ mặt bằng** (kéo thả bàn, đặt quầy bar và cửa) |

---

## Việc phải làm ngoài giao diện

Ba việc này **không phải CSS**, cần backend và phải tính vào kế hoạch:

1. **Thêm `x, y, w, h, zone` cho bàn** trong `schema.sql` + API lưu mặt bằng.
2. **Thêm màn thứ 37**: Quản trị kéo thả vẽ mặt bằng. Kéo thả trên cảm ứng là
   tương tác khó làm đúng; dự án motion-cut nên phải tự viết, không cài thư viện.
3. **Phóng to hai ngón** cho sơ đồ mặt bằng ở khung hẹp.

Và một việc frontend thuần:

4. **Sửa 8 chỗ giọng văn đã đếm trong code**:

| Sửa | Số chỗ |
|---|---|
| `hủy` → `huỷ` | 27 |
| `xóa` → `xoá` | 9 |
| `…` → `...` | 83 |
| `Tình trạng` → `Trạng thái` | 1 |
| bỏ `"thành công!"` (giữ ở màn thanh toán) | 9 |
| `Sửa Đặt Bàn` → `Sửa đặt bàn` | 1 |
| **Bốn tên QR** (`VNPay/QR` · `VNPay / QR` · `Thẻ / VNPay` · `Chuyển khoản/QR`) → `Mã QR` | 7 |

---

## Exports

- `tokens.css` — toàn bộ biến, sáng và tối, kèm nền tảng và luật `.rims-i`
- `icons.ts` — bảng `ICONS` 30 icon + `ICON_MEANING` làm nguồn cho bài test
- `06-spec.html` — spec dựng thật, xem được cả hai chế độ
