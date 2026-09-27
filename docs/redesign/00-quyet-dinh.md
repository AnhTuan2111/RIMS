# Quyết định thiết kế lại RIMS — sổ chốt

Mỗi phiếu phỏng vấn xong thì chốt xuống đây. Phiếu 05 chỉ là việc lắp lại,
không hỏi thêm. File này là nguồn thật cho `design.md` mới.

---

## Phiếu 01 · Hướng thiết kế tổng thể — CHỐT 2026-09-27

| Câu | Chốt |
|---|---|
| Hướng | **C · Phiếu bếp** — neo-brutalist POS: viền đen dày, bo 0px, nhãn in hoa |
| Sáng / tối | Sáng là chính, tối là bản phụ |
| Mật độ | **Khác theo họ màn**: vận hành thoáng, quản trị dày |
| Máy của màn vận hành | Cả ba (tablet · laptop · điện thoại), không ưu tiên |
| Giọng | **Một hệ duy nhất** cho cả 36 màn, kể cả trang công khai |
| Bo góc | Theo hướng → **0px** |
| Độ nổi bề mặt | **Bóng cứng lệch, kiểu in** — theo hướng C (người dùng sửa lại 27/09) |
| Ảnh món | **Nhân vật chính** — ảnh to, màn xoay quanh ảnh |
| Trộn hướng | Không trộn |
| Giữ gì / bỏ gì | Làm mới hoàn toàn |

### Tham chiếu người dùng đưa

- setproduct.com/blog/retro-brutalist-ui-design-2026
- theplusaddons.com/blog/neo-brutalism-web-design

Trích được, dùng làm luật:

- Viền **2px–5px**, một màu phẳng gần-đen, bản thân viền là thành phần đồ hoạ.
- Bo góc **0** ("kill the radius"); quá 8px là đã sang style khác.
- Bóng **offset cứng, blur = 0** — `box-shadow: 6px 6px 0 #000`. Đọc như bóng in
  hoặc sticker, không phải chiều sâu.
- Hover = **lún vào bóng của chính nó**: `translate(3px,3px)` + bóng co lại
  `3px 3px 0`; active thì lún hết, bóng về `0 0 0`. Chuyển động **≤100ms**,
  gần như không easing. Bắt buộc có `prefers-reduced-motion`.
- Palette: **một màu một mặt**, không gradient không tint. Chroma cao.
- Nền trang: trắng hoặc **off-white ấm** (`#faf7f0` / `#f4f0e6`).
- Tương phản: bài thứ hai đo được AAA; bài thứ nhất chốt sàn **4.5:1** cho chữ
  và cảnh báo brutalist site hay xoá focus ring — phải đặt `:focus-visible`
  **màu tương phản**, vì viền dày dễ "ăn" mất vòng focus.
- Texture scanline chỉ được là overlay `rgba(0,0,0,.06)` + `pointer-events:none`,
  không bao giờ chạm tương phản của chữ thật.

### Hai cảnh báo từ chính hai bài đó, áp thẳng vào RIMS

1. **"Dense data / tables" nằm trong danh sách style này KHÔNG phù hợp.**
   RIMS có 11 màn quản trị + thống kê toàn bảng. Cách xử lý: style được tiết chế
   theo họ màn — viền dày và bóng cứng dành cho **thẻ, nút, modal, phiếu**;
   **trong lòng bảng** thì viền mảnh 1px, không bóng, không in hoa từng ô.
   Chốt ở phiếu 02 §4.
2. **`-webkit-font-smoothing: none`** bài thứ nhất khuyên — **không áp dụng**.
   Giao diện toàn tiếng Việt, tắt làm mịn làm dấu bị vỡ ở cỡ nhỏ. Bỏ luật này,
   ghi lại lý do.

### Bóng — đã chốt, còn phải hiệu chỉnh

Bóng offset cứng **có**, đúng chữ ký hướng C và đúng cả hai bài tham chiếu.
Kéo theo hai thứ được chốt luôn:

- Cơ chế hover là **lún vào bóng của chính nó** (`translate` = đúng khoảng lệch
  của bóng, bóng co lại theo), ≤100ms, không easing mềm.
- Không cần cơ chế hover thay thế bằng đảo nền.

Còn hở hai chi tiết, hỏi ở phiếu 02 §0:

1. **Độ lệch bao nhiêu** — 3px / 4px / 6px / 8px. Bài tham chiếu cho cả
   `6px 6px 0` và `8px 8px 0`; 8px rất mạnh, trên màn dày sẽ chen nhau.
2. **Bóng được xuất hiện ở đâu.** Đây là chỗ xử lý cảnh báo "dense data" phía
   trên: nếu đổ bóng lên mọi bề mặt thì 11 màn quản trị thành một rừng bóng.
   Đề xuất: bóng dành cho **thẻ · nút · modal · phiếu · chip nổi**; **không**
   đổ trong lòng bảng, không đổ lên hàng danh sách, không đổ lên ô nhập.

### Mặt chữ — ràng buộc cứng: đủ dấu tiếng Việt

Hai bài gợi ý Berkeley Mono / Departure Mono — cả hai **không có** bộ dấu
tiếng Việt. Thay bằng:

| Vai | Mặt chữ | Vì sao |
|---|---|---|
| Display | Archivo 700/800 | có subset `vietnamese`, thân chữ đặc, in hoa rất chắc |
| Thân | IBM Plex Sans 400/500/600 | có `vietnamese`, giọng kỹ thuật, không lạnh |
| Số & mã | JetBrains Mono 400/500/700 | có `vietnamese`, `tabular-nums` |

---

## Phiếu 02 · Khung màn & điều hướng — CHỐT 2026-09-27

| Câu | Chốt |
|---|---|
| Bóng lệch | ~~3px~~ → **4px** (sửa ở phiếu 02B, câu V9) |
| Màu nhấn | **Đỏ son `#e0301f`** |
| Độ dày viền | **2px** |
| Bóng ở đâu | **Tiết chế** — chỉ thẻ · nút · modal · phiếu · chip nổi. Không đổ trong bảng, hàng danh sách, ô nhập |
| Điều hướng | **N4 · Rail ký hiệu hẹp** |
| Khung vận hành | **V2 · Ba cột theo trạng thái (kanban)** |
| Sơ đồ bàn | **B2 · Sơ đồ mặt bằng thật** |
| Khung quản trị | **Q4 · Catalogue thẻ có ảnh** + đồng ý trộn theo đề xuất |
| Trang khách | **P4 · Danh mục dính + lưới món** |
| Hành động chính | **Ngay trên từng phiếu / thẻ** |
| Bảng ở 320px | Cuộn ngang trong hộp có viền |
| Quay lại | **Breadcrumb** (Bàn / Bàn 04 / Đơn #118) |
| Chiều rộng tối đa | Giãn hết màn, không giới hạn |
| Vân scanline | **Không dùng** |
| Đồng hồ / ca làm | **Luôn hiện ở thanh trên, mọi vai trò** |

Người dùng yêu cầu: làm thêm **phiếu 02B** mổ riêng các ngoại lệ và nhược điểm
của chính những lựa chọn trên, giải quyết triệt để trước khi sang component.

### Mười chỗ căng phải giải ở phiếu 02B

| # | Căng ở đâu | Loại |
|---|---|---|
| 1 | N4 rail hẹp **không có thanh trên**, nhưng đồng hồ phải luôn hiện ở thanh trên + có breadcrumb | mâu thuẫn trực tiếp |
| 2 | 10 mục menu Quản trị nhét vào rail 3rem | sức chứa |
| 3 | N4 sống chết bằng ký hiệu, mà bộ icon tới phiếu 04 mới chốt | thứ tự phụ thuộc |
| 4 | V2 kanban chỉ đúng cho 3 màn bếp, không đúng cho ~20 màn vận hành còn lại | khung không tổng quát |
| 5 | Kanban 3 cột chết ở 320px, mà thiết bị được chốt "cả ba ngang nhau" | responsive |
| 6 | B2 mặt bằng thật cần **toạ độ bàn trong DB** + **một màn vẽ mặt bằng mới** cho Quản trị | tăng phạm vi ra ngoài giao diện |
| 7 | Q4 thẻ có ảnh là khung **thưa nhất**, mâu thuẫn với "quản trị dày"; 8/11 màn quản trị không có ảnh | mâu thuẫn trực tiếp |
| 8 | "Giãn hết màn không giới hạn" áp lên form đăng nhập và trang khách ở 2560px | mâu thuẫn theo loại nội dung |
| 9 | Bóng 3px + hover lún nửa bước = 1.5px, mắt gần như không thấy | hiệu chỉnh xúc giác |
| 10 | Đỏ son làm màu nhấn trùng họ với màu lỗi `#c41f14` | phân biệt trạng thái |

## Phiếu 02B · Giải quyết ngoại lệ — CHỐT 2026-09-27

| Vấn đề | Chốt |
|---|---|
| V1 · thanh trên cho rail | **A1b sửa** — không có slab. Đồng hồ nằm **cùng hàng với breadcrumb** ở đầu vùng nội dung. **Không hiện tên người dùng.** Ca làm = **một icon cạnh đồng hồ** |
| V2 · 10 mục Quản trị | **A2b** — 4 nhóm ở rail + mục con thành băng ngang |
| V3 · ký hiệu trong rail | **A3a** — icon một nét vẽ tay + nhãn chữ nhỏ dưới icon → rail 4.6rem |
| V4 · phạm vi kanban | **B4a** — kanban chỉ cho màn có dòng trạng thái thật |
| V5 · kanban ở 320px | **B5a** — dưới 52rem: một cột + băng tab trạng thái có số đếm |
| V6.1 · dữ liệu mặt bằng | **C6.1b** — thêm `x,y,w,h,zone` + **màn thứ 37**: Quản trị kéo thả vẽ mặt bằng |
| V6.2 · mặt bằng khung hẹp | **Giữ mặt bằng**, thu nhỏ + **phóng to hai ngón** |
| V7 · quản trị thẻ vs dày | **D7a** — nút đổi chế độ **THẺ ↔ BẢNG**, mặc định thẻ, ghi nhớ theo người dùng |
| V8 · chiều rộng | **E8a** — giãn hết cho bảng/kanban/mặt bằng; form ≤46rem; văn bản ≤68ch; cột lưới ảnh ≥15rem |
| V9 · hover | **F9b** — **bóng lên 4px**, hover lún 2px, bấm lún thêm 2px |
| V10 · đỏ nhấn vs đỏ lỗi | **F10b** (lỗi = đen) — nhưng **bị thay bởi yêu cầu mới**, xem dưới |
| Bảng phân công | Đồng ý phần lớn, ba chỗ sửa |

### Ba sửa cho bảng phân công

1. **Luồng đăng nhập / đăng ký làm nhỏ gọn**, không chiếm cả trang. Người dùng gợi ý
   đặt hẳn vào **một góc động trên HomePage**. → cần chốt có còn route riêng hay không.
2. **CustomerReservations dùng y hệt luồng đặt bàn của Phục vụ** — không thiết kế riêng.
3. **WaiterCreateOrderPage / WaiterUpdateOrderPage phải giống một cái menu nhất có thể** —
   tức là màn gọi món *là* thực đơn có ảnh to, không phải biểu mẫu. Củng cố
   "ảnh món là nhân vật chính". → cần chốt giỏ đơn nằm đâu.

### Yêu cầu mới, lớn hơn V10: hệ màu có nghĩa

Người dùng không muốn một màu nhấn duy nhất nữa. Nguyên văn ý: phối app theo
**nhiều màu — đỏ · vàng · xanh dương · xanh lục** — và **phối lại màu các nút bấm
để người khác đọc được nghĩa**. Phương án họ tự nêu: **Thanh toán = xanh lục,
Huỷ = đỏ**.

Đây là đổi kiến trúc màu, không phải đổi một token, nên tách thành **phiếu 02C**
và phải chốt trước phiếu 03 vì mọi component đều ăn theo nó.

Tương phản đã đo thật (nền `#111214` / `#ffffff`):

| Màu | Với chữ đen | Với chữ trắng | Dùng |
|---|---|---|---|
| Lục rực `#2fe06a` | 10.70 | 1.75 | chữ đen · AAA |
| Đỏ rực `#ff4436` | 5.47 | 3.42 | chữ đen · AA thường, AAA chữ lớn đậm |
| Vàng `#ffd400` | 13.09 | 1.43 | chữ đen · AAA |
| Xanh `#35c8ff` | 9.69 | 1.93 | chữ đen · AAA |
| Lục đậm `#12703f` | 3.05 | 6.15 | chữ trắng · AA+ |
| Đỏ đậm `#c8271b` | 3.36 | 5.58 | chữ trắng · AA+ |
| Hổ phách đậm `#a15c00` | 3.61 | 5.19 | chữ trắng · AA+ |
| Xanh đậm `#1b5fbf` | 3.07 | 6.11 | chữ trắng · AA+ |

### Xung đột mới sinh từ chính đáp án 02B

| # | Căng ở đâu |
|---|---|
| 11 | Chọn **A1b không có slab** nhưng **A2b** định nghĩa băng mục con nằm *dưới slab*. Không còn slab thì băng đó nằm đâu → hỏi ở 02C §0 |
| 12 | **Phóng hai ngón** trên mặt bằng là tương tác cảm ứng phải tự viết (dự án motion-cut, không cài thư viện). Ghi nhận là việc thật, không phải CSS |
| 13 | Đăng nhập nằm trong HomePage → ảnh hưởng `AuthRoutes`, không chỉ giao diện → hỏi ở 02C §3 |

## Phiếu 02C · Hệ màu có nghĩa — CHỐT 2026-09-27

| Câu | Chốt |
|---|---|
| V11 · vỏ app | **B** — hàng breadcrumb + đồng hồ **trên**, băng mục con **dưới** |
| **PHỐI MÀU** | **P2 · bốn màu đậm, chữ trắng** |
| Luật 1 · nút chính | **Luôn lục**, mọi màn |
| Luật 2 · nút huỷ | **Chỉ viền đỏ**; tô đặc chỉ ở bước xác nhận trong hộp thoại |
| Luật 3 · chip trạng thái | **Tô đặc + ký hiệu riêng mỗi trạng thái** (an toàn cho người mù màu) |
| Luật 4 · số màu | Tối đa **3 màu** một khung nhìn, chưa kể đen và giấy |
| Luật 5 · chế độ tối | "Giữ nguyên bốn màu, đảo nền và mực" — **đo ra là không dùng được**, xem dưới |
| Luật 6 · màu trang trí | Được, miễn **không dùng bốn màu nghĩa** |
| Sửa 1 · đăng nhập | **S1a** — ô động trên HomePage, **vẫn giữ route riêng** |
| Sửa 2 · giỏ đơn | **S2a** — cột dính bên phải, luôn thấy |

### Bảng token màu đã chốt (P2)

| Vai | Mã | Chữ | Tương phản |
|---|---|---|---|
| Làm / xong / thanh toán | `#12703f` | trắng | 6.15 |
| Bỏ / lỗi / quá hạn | `#c8271b` | trắng | 5.58 |
| Chờ / đang nấu | `#a15c00` | trắng | 5.19 |
| Thông tin / đã đặt | `#1b5fbf` | trắng | 6.11 |
| Mực | `#111214` | giấy | 18.74 trên trắng |
| Giấy | `#f3f1ea` | — | 16.58 với mực |

### Hai ghi chú cuối phiếu 02C, cả hai đều sinh việc

1. **HomePage: ảnh món tự động cuộn, người dùng dừng được và cho chạy tiếp.**
   → component băng cuộn có điều khiển, bắt buộc tôn trọng `prefers-reduced-motion`.
2. **"Màu chính của app vẫn là đỏ như ban đầu, phong cách retro."**
   → xung đột với Luật 1 (nút chính lục) và Luật 2 (nút huỷ viền đỏ). Đỏ đang
   phải làm ba việc cùng lúc: thương hiệu, huỷ, lỗi. Phải chốt vai ở phiếu 03.
   → và "retro" là một lớp từ vựng chưa định nghĩa: sọc, halftone, starburst,
   chữ nét đôi, băng chữ chạy… phải chốt cái nào được dùng.

### Đo được: Luật 5 không dùng được nguyên trạng

| Màu P2 | Trên nền tối `#12141a` | Trên mặt tối `#1b1e26` |
|---|---|---|
| Lục `#12703f` | **2.99** | **2.71** |
| Đỏ `#c8271b` | 3.30 | **2.98** |
| Hổ phách `#a15c00` | 3.55 | 3.21 |
| Xanh `#1b5fbf` | 3.01 | **2.73** |

Sàn cho thành phần phi văn bản là 3:1 — bốn màu đậm của P2 **trượt hoặc sát sàn**
trên nền tối. Nặng hơn: **bóng đen `#111214` trên nền tối chỉ đạt 1.02:1 — vô hình**,
mà bóng offset cứng là chữ ký của cả hệ. Chế độ tối phải đổi cả màu và màu bóng.
→ ba phương án ở phiếu 03 §0.

### Đỏ retro ứng viên (đo với chữ trắng, theo luật "màu đậm chữ trắng" của P2)

| Tên | Mã | Chữ trắng | Ghi chú |
|---|---|---|---|
| Son rực (đỏ ban đầu) | `#e0301f` | **4.55** | vừa đủ AA chữ thường, không còn dư |
| Gạch retro | `#cf3a24` | 4.90 | dư một chút |
| Đỏ đất | `#b5372a` | 5.92 | an toàn nhất, retro nhất |
| Dùng chung đỏ huỷ | `#c8271b` | 5.58 | không thêm màu mới |

### Đính chính dữ liệu mẫu

`frontend/public/image` có **43 ảnh món thật** và thực đơn là **món Nhật**
(ramen, sashimi, tempura, katsudon, unadon, soba…), không phải món Việt.
Dữ liệu mẫu trong mọi phiếu từ 03 trở đi dùng đúng tên món này.

## Phiếu 03 · Đỏ retro · chế độ tối · băng ảnh — CHỐT 2026-09-27

| Câu | Chốt |
|---|---|
| Sắc đỏ retro | **Gạch `#cf3a24`** (4.90 với chữ trắng) |
| Vai của đỏ | R1 — nhưng **ghi chú ghi đè**: đỏ **ĐƯỢC** lên nút |
| Chế độ tối | D2 — nhưng **ghi chú ghi đè**: giữ bộ màu, **chỉnh lại giá trị + audit** |
| Ký hiệu trạng thái | **S2 · dấu mang nghĩa** |
| Băng ảnh | **B1 · một băng chạy liên tục**, nút dừng góc dưới phải |
| Băng dừng khi nào | nút dừng **+ rê chuột + focus bàn phím** |
| Bấm vào ảnh | **cuộn xuống tới món đó trong lưới thực đơn** |
| Tốc độ | **chậm ~40s** một vòng |
| Từ vựng retro | **cả 6**: sọc chéo · chữ nét đôi · số bảng tỉ số · halftone · starburst · băng chữ chạy |

### Hai ghi đè từ ghi chú, đã áp dụng

1. **Đỏ được lên nút, và nút huỷ có hình dạng giống mọi nút khác.**
   → Bỏ Luật 2 của phiếu 02C ("nút huỷ chỉ viền đỏ").
   → Luật mới: **mọi nút cùng một hình dạng** (tô đặc + viền 2px + bóng 4px);
     **nghĩa nằm ở màu**. Lục = làm · đỏ = huỷ/phá · đen hoặc trắng = trung tính.
   → Rủi ro đã nói với người dùng và người dùng vẫn chọn: nút huỷ đỏ tô đặc cạnh
     nút chính lục dễ bấm nhầm khi tay đang bận. Giảm thiểu bằng: khoảng cách
     tối thiểu 24px giữa nút chính và nút phá huỷ, và hộp thoại xác nhận cho
     việc không đảo được.
2. **Chế độ tối: giữ bộ màu, chỉnh lại giá trị, đo và audit.**

### Bộ màu chế độ tối — giữ nguyên hue, nâng độ sáng, chữ đổi sang đen

| Vai | Sáng | Tối | Hue lệch | Chữ đen (tối) | Khối vs mặt tối |
|---|---|---|---|---|---|
| Làm / xong | `#12703f` | `#10ad5b` | 3° | 6.38 | 5.67 |
| Huỷ / lỗi | `#c8271b` | `#eb746b` | 2° | 6.46 | 5.75 |
| Chờ | `#a15c00` | `#e08000` | 0° | 6.48 | 5.76 |
| Thông tin | `#1b5fbf` | `#5999f3` | 4° | 6.49 | 5.77 |
| Thương hiệu | `#cf3a24` | `#ee7462` | 1° | 6.52 | 5.80 |

Nền tối `#12141a` · mặt tối `#1b1e26` · mực sáng `#eceef2` · viền và bóng dùng mực sáng.

### AUDIT: 29/29 cặp đạt ngưỡng — 100%

Sàn dùng: **4.5:1** cho chữ · **3.0:1** cho khối phi văn bản và viền.
Không có cặp nào trượt ở cả hai chế độ.

### Audit lộ ra một vấn đề mới

**Đỏ thương hiệu `#cf3a24` và đỏ huỷ `#c8271b`** ở chế độ tối trở thành
`#ee7462` và `#eb746b` — **gần như cùng một màu**. Cộng với việc đỏ giờ được lên
nút, nút "thương hiệu" và nút "huỷ" sẽ trông y nhau ở chế độ tối.
→ Đề xuất: **gộp thành một đỏ duy nhất**. Hỏi ở phiếu 04 §0.

### 13 trạng thái thật trong code — nguồn cho bảng chip

| Enum | Giá trị |
|---|---|
| `TableStatus` | AVAILABLE · RESERVED · SERVING |
| `OrderStatus` | SERVING · LOCKED · COMPLETED |
| `OrderItemStatus` | PREPARING · COMPLETED · CANCELLED |
| `ReservationStatus` | QUEUED · WAITING · COMPLETED · CANCELLED |
| `PaymentMethod` | CASH · QRCODE |
| `OrderShift` | MORNING · … (ca sáng/chiều/tối) |

Ký hiệu S2 phải gán **theo nghĩa của từng trạng thái**, không theo màu —
vì `✓` cho "bàn trống" là sai nghĩa. Bảng gán đầy đủ ở phiếu 04 §3.

## Phiếu 04 · Toàn bộ component — CHỐT 2026-09-27

| Câu | Chốt |
|---|---|
| Một đỏ hay hai đỏ | **Một đỏ duy nhất `#c8271b`** — thương hiệu và huỷ dùng chung |
| Việc đảo được | **Làm ngay + toast có Hoàn tác**, không hỏi lại |
| Vị trí toast | **Góc trên phải**, xếp chồng xuống |
| Số lượng món | Nút **−/+**, bấm vào số thì gõ được |
| Hiển thị tiền | **Rút gọn `485K` ở chỗ hẹp, đầy đủ `485.000 ₫` ở bảng** |
| Bảng ở 320px | Giữ **cuộn ngang** |

### Luật tiền — chốt cụ thể từ câu "rút gọn ở chỗ hẹp"

| Chỗ | Dạng |
|---|---|
| Bảng, hoá đơn, tổng tiền, màn thanh toán | `485.000 ₫` đầy đủ |
| Thẻ bàn, thẻ món, chip, băng ảnh, ô thống kê, phiếu bếp | `485K` |
| Ngưỡng rút gọn | từ 1.000 trở lên; dưới 1.000 thì ghi thẳng |
| Triệu | `18,4tr` ở ô thống kê · `18.400.000 ₫` ở bảng |

### Bộ component đã duyệt

Nút (5 màu × 8 trạng thái) · ô nhập và mọi điều khiển · 13 chip từ enum thật ·
thẻ bàn · phiếu bếp · thẻ món có ảnh · ô thống kê số-bảng-tỉ-số · bảng tiết chế
có sắp xếp và phân trang · hộp thoại · toast · panel bay ra · tooltip ·
trạng thái rỗng/tải/lỗi · vỏ app đầy đủ · tab kanban khung hẹp ·
bảng cho phép 6 thủ pháp retro theo họ màn.

### Sửa duy nhất người dùng yêu cầu

> "chế độ tối, màu của các nút bấm không được ổn cho lắm, cái nền của nó ấy,
> thử làm lại 1 bộ chế độ tối xem, sáng tạo hơn 1 chút cũng được"

Chẩn đoán: bốn màu tối ở phiếu 04 đều **sáng và no màu, tô đặc cả khối**, nên trên
nền gần-đen đọc ra như bốn viên kẹo phát sáng — "neon trên đen", không phải retro
in ấn. Viền trắng + bóng trắng quanh mỗi khối càng làm chúng thành sticker dán.

→ Dựng lại **bốn concept khác nhau về nguyên tắc**, không phải bốn biến thể độ
sáng, ở **phiếu 04B**.

## Phiếu 04B · Chế độ tối — CHỐT 2026-09-27 (sau ba lần dựng)

### Hai lần dựng đầu đều sai, ghi lại để không lặp

1. **Lần một** — viền trắng + bóng trắng trên nền gần-đen → mỗi nút thành một
   miếng sticker dán. Người dùng bác cả bốn phương án.
2. **Lần hai** — người dùng chỉ sang dự án KPI của họ (`X:/IdeaProjects/kpi-manage`,
   theme `qlcv-aura`) để học **cách làm** chế độ tối. Tôi bê cả **cái vẻ** sang:
   Lora serif, sơn mài, chỉ vàng, bo 2px, bỏ bóng → thành app hành chính.
   Người dùng bác: *"đang phong cách retro mà bạn lại làm nó như kiểu app nhà nước rồi"*.

**Bài học ghi lại:** khi tham chiếu một hệ khác, tách **kỹ thuật** khỏi **cái vẻ**.
Kỹ thuật chế độ tối bóc ra từ `qlcv-aura` chỉ còn ba điều:

- nền tối phải cùng nhiệt độ với giấy của bản sáng
- **viền và bóng là trung tính VỪA, không bao giờ trắng** — gốc của vụ sticker
- **chip là nền tint tối + chữ màu sáng**, không phải khối màu rực

### Lần ba: đưa núm xoay + số WCAG chạy theo, người dùng tự dừng

| Núm | Chốt |
|---|---|
| Độ sáng viền & bóng | **bậc 3** — `#6b6b6b`, đúng ngưỡng đạt 3:1 |
| Nhiệt độ nền | **Trung tính** (không phải ấm) |
| Kiểu nút | **Nền tint tối + viền màu + chữ màu** |
| Kiểu chip | **Nền tint tối + chữ sáng** |
| Bóng lệch ở chế độ tối | **2px** (bản sáng vẫn 4px) |
| Phạm vi | **Cả 37 màn** đều có chế độ tối |
| Đổi chế độ | **Nút trên hàng breadcrumb**, nhớ theo từng người dùng |

### Token chế độ tối — CHỐT

| Vai | Mã |
|---|---|
| Nền trang | `#131313` |
| Mặt thẻ | `#1b1b1b` |
| Mặt chìm | `#232323` |
| Mực | `#ececec` |
| Mực phụ | `#bdbdbd` |
| **Viền + bóng** | `#6b6b6b` |
| Làm / xong | `#167a46` · nền tint `#16281d` · chữ `#5fd08e` |
| Huỷ / lỗi | `#c8271b` · nền tint `#2b1512` · chữ `#ff8a72` |
| Chờ | `#a15c00` · nền tint `#2a1f0b` · chữ `#ffc94a` |
| Thông tin | `#2069c9` · nền tint `#141c2e` · chữ `#7aaaff` |

**Audit tại vị trí núm đã chốt: 9/9 đạt** — mực/mặt 14.58 · mực phụ 9.17 ·
viền/mặt 3.23 · viền/nền 3.49 · nút chính 8.04 và 8.94 · nút huỷ 7.49 ·
chip chờ 10.55 và 11.24.

**Phát hiện đáng chú ý:** giữ nguyên hue P2 và chỉ nâng đủ để khối đạt 3:1 thì
**đỏ `#c8271b` và hổ phách `#a15c00` không phải đổi gì** — y nguyên bản sáng.
Chỉ lục `#12703f → #167a46` và xanh `#1b5fbf → #2069c9` nhích một bậc.

**Hệ quả cần ghi vào spec:** ở chế độ tối mọi nút đều là nền tint, nên **không có
nút nào "tô đặc"**. Nút chính phân biệt bằng **màu viền và màu chữ là lục**, và
luật "một màn đúng một nút lục" vẫn đủ để nó là thứ duy nhất mang lục.

## Phiếu 05 · Bộ icon & giọng văn — CHỐT 2026-09-27

### Hệ icon: học nguyên hệ thống từ `kpi-manage` (theme qlcv-aura), không lấy hình học

Nguồn: `workspace/shared/ui/icons.ts` (101 icon) · `Icon.tsx` · `workspace/base.css` ·
`workspace/test/themeIcons.test.ts`.

**Lấy — hệ thống:**

- Một bảng hằng `ICONS`, mỗi icon chỉ là chuỗi `<path>`, không có `<svg>` bọc
- Một component `<Icon name>` · `viewBox="0 0 24 24"` · `aria-hidden="true"`
- **Độ dày nét đặt một lần ở class `.i`**, không viết trong từng icon
- Tên khoá camelCase tiếng Anh, ngắn, ổn định
- **Luật gốc, trích nguyên văn comment của họ:** *"một nghĩa một icon, một icon một nghĩa"*
- **Log gỡ trùng nghĩa ghi trong comment** — khi icon mới chiếm một nghĩa, icon cũ
  bị thu hẹp và việc đó được viết xuống
- Bài test canh lệch bộ

**Không lấy — hình học:** `rx="2"`, vòng tròn, cung bo, đầu nét tròn, nét 1.75.
RIMS đã chốt bo 0 và viền 2px đầu nét vuông.

### Chốt

| Câu | Chốt |
|---|---|
| Hình học icon | **G2 · vuông hoá** — cùng cấu trúc hình của qlcv-aura, `rx → 0`, vòng tròn → vuông, đầu nét vuông |
| Độ dày nét | **2** — cùng độ dày với viền component |
| Sổ nghĩa | **29 icon**, bốn chỗ trùng nghĩa đã gỡ |
| Bài test | **Có**, và canh thêm **icon không ai dùng** |
| Chính tả | **`huỷ`** (sửa 27 chỗ đang viết `hủy`) |
| Dấu ba chấm | **`...`** ba dấu chấm (sửa 83 chỗ đang dùng `…`) |
| Trạng thái | **`Trạng thái`** — sửa 1 chỗ `Tình trạng` |
| `"thành công!"` | **Chỉ giữ ở màn kết quả thanh toán** — bỏ 9 chỗ còn lại |
| Title Case | Sửa `Sửa Đặt Bàn` → **`Sửa đặt bàn`** |
| Gạch chéo | Bỏ — dùng **`Mã QR`**, khớp enum `PaymentMethod` |
| Nhãn nút | **Động từ + tân ngữ ngắn**: "Xong món", "Huỷ món" |
| Thông báo lỗi | **Ba phần**: chuyện gì · dữ liệu còn hay mất · làm gì tiếp |
| Gọi người dùng | **Không gọi ai** — câu không chủ ngữ |
| Ngày giờ | **`27/09 19:42`** — bỏ năm nếu là năm nay |
| Bảng từ vựng | **Đồng ý toàn bộ** (13 khái niệm, có cột icon) |

### Bốn chỗ trùng nghĩa đã gỡ

1. `table` giữ nghĩa **bàn ăn**; chế độ xem thẻ đổi sang `cards` (hai dải ngang)
2. `ticket` **có khung**; `rows` **không khung**, chỉ bốn vạch trần
3. `check` chỉ cho **nút và hộp kiểm**; chip trạng thái dùng **ký hiệu chữ**, không icon
4. `ban` = **huỷ** · `x` = **đóng** (đã thu hẹp nghĩa) · `trash` = **xoá**

### Ghi chú cuối của người dùng — sửa một lỗi tôi để lọt

> "nút xóa phải giống những nút còn lại như nút xong món, có hover, có nền,..."

Đúng. Trong bản dựng phiếu 05 tôi để `.b--sm` có `box-shadow: none` và
`:hover { transform: none }`, nên nút huỷ cỡ nhỏ **mất bóng và mất chuyển động lún**
— trái luật "mọi nút cùng một khuôn, nghĩa nằm ở màu" đã chốt ở phiếu 04.

**Luật ghi vào spec:** biến thể kích cỡ (`--sm`, `--lg`) **chỉ được đổi cỡ chữ và
đệm trong**. Không được đổi: nền, viền, bóng, hành vi hover và active. Mọi nút —
kể cả nút huỷ, kể cả cỡ nhỏ nhất trong hàng bảng — đều có nền, viền 2px, bóng lệch,
và lún vào bóng khi bấm.


## Phiếu 06 · Spec tổng hợp — ĐÃ GIAO 2026-09-27

Giao: `06-spec.html` (được style bằng chính `exports/tokens.css`) ·
`exports/tokens.css` · `exports/icons.ts` · `exports/design.md`.

### Bốn lỗi người dùng soi ra trên bản dựng, đã sửa

| # | Lỗi | Nguyên nhân | Sửa |
|---|---|---|---|
| 1 | Ô `+` dài hơn ô `−` | `.qty` là `inline-flex` nhưng nằm trong grid nên bị **kéo giãn full width**; phần thừa trông như nút `+` rộng ra | `justify-self: start` + `width: max-content` |
| 2 | **Không có nút "Để sau"** trong hệ thống | Tôi **bịa nhãn**. Code chỉ có ba vai: `rk-btn--go` · `rk-btn--danger` · `rk-btn--quiet` | Thay bằng nhãn thật: `Quay lại` · `Làm mới` · `Xoá bộ lọc`. Gỡ luôn "Chốt đơn" — cũng bịa |
| 3 | **Không có trạng thái "Đang dọn"** | Tôi bịa. `TableStatus` chỉ có `AVAILABLE · SERVING · RESERVED` | Còn đúng ba thẻ bàn. Sọc kẻ chéo chuyển sang minh hoạ **nút vô hiệu** — chỗ dùng thật |
| 4 | Ô doanh thu lạc so với hai ô kia | Ô dấu phẩy bị bỏ nền và viền (`.sep`), cộng dòng "triệu đồng" nằm **dưới** ô số nên cấu trúc khác hai ô kia | Ô dấu phẩy dùng **đúng khuôn** với ô số; **đơn vị đưa lên nhãn** |

**Bài học ghi lại:** ba trong bốn lỗi là tôi **vẽ nội dung không có trong app**.
Trước khi dựng bất kỳ ví dụ nào, đọc code lấy nhãn và enum thật.

### Hai lỗi giọng văn MỚI lộ ra khi đọc code lần này

| Lỗi | Số đếm |
|---|---|
| `xóa` vs `xoá` | 9 vs 11 |
| **Bốn tên cho một phương thức QR**: `VNPay/QR` (2) · `VNPay / QR` (3) · `Thẻ / VNPay` (1) · `Chuyển khoản/QR` (1) | 7 chỗ |

Tổng danh sách sửa giọng văn: **8 nhóm**, không phải 6.

### Nhãn nút thật trong app

`Xong món` · `Thanh toán` · `Hủy món` · `Làm mới` · `Quay lại` · `Xoá bộ lọc` ·
`Tìm` · `PDF` · `Bật âm thanh`. Không bịa nhãn mới.
