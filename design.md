# Design — RIMS

Hệ thiết kế đã khoá cho toàn bộ ứng dụng. Mọi lần thiết kế lại một màn đều đọc
file này trước khi viết code. Không sinh lại theo từng màn — cần mở rộng thì sửa
chính file này.

Tên gọi nội bộ của hệ: **Phiếu bếp**.

---

## Genre

**modern-minimal** — phần mềm vận hành nội bộ, dữ liệu dày, đọc nhanh trong ca
làm việc. Không editorial, không playful, không atmospheric.

Giọng cụ thể: **phiếu order giấy**. Mặt làm việc trông gần với nghề hơn là gần
với phần mềm. Kẻ đứt đoạn như phiếu in, khối vuông không bo góc, vạch trái đậm
đánh dấu từng mục, số luôn là chữ số bảng.

## Họ macrostructure

Ba họ. Màn trong cùng một họ dùng chung hình dạng; chỉ khác nhau ở archetype
thành phần.

| Họ | Macrostructure | Màn | Knob được phép đổi |
|---|---|---|---|
| Công khai | **Marquee Hero** (trang chủ) · thẻ giữa màn (auth) | 7 | Archetype hero, có/không enrichment |
| Vận hành | **Workbench** — mặt làm việc *là* trang, chrome lùi lại | 18 | Bề mặt dữ liệu (bảng / thẻ / sơ đồ), vị trí hành động chính |
| Quản trị | **Catalogue** — chỉ mục bản ghi đều nhau + rail lọc | 11 | Cột bảng, bộ lọc, có/không thống kê đầu màn |

**Nav: N3 Side-rail.** Thanh bên cố định từ 60rem trở lên; dưới ngưỡng đó thu
thành **ngăn kéo** mở bằng nút trên thanh đầu trang. Không bao giờ xếp toàn bộ
menu lên trên nội dung.

**Footer: Ft2** một dòng, **chỉ** ở trang công khai. Màn ứng dụng không có footer.

## Theme

Ghi bằng **hex**, không phải oklch. Đây là lựa chọn có ý thức chứ không phải
trôi dạt: 195 biến hiện có, các lớp đè chế độ tối, và lối tạo màu mờ bằng
`rgb(var(--rims-tint-*) / N%)` đều đang dùng hex và chạy đúng. Đổi sang oklch là
churn không mang lại gì cho người dùng.

### Chế độ sáng

| Vai trò | Giá trị | Dùng cho |
|---|---|---|
| `--rims-paper` | `#faf6ef` | Nền trang, giấy ấm |
| `--rims-surface` | `#fffdf8` | Mặt thẻ, mặt phiếu |
| `--rims-surface-2` | `#f2ece1` | Đầu bảng, ô chìm |
| `--rims-surface-3` | `#e8e0d1` | Ô chìm sâu hơn |
| `--rims-line` | `#e0d5c2` | Kẻ mảnh |
| `--rims-line-strong` | `#8a7b67` | Kẻ đậm, viền phi văn bản |
| `--rims-ink` | `#2b2118` | Chữ chính |
| `--rims-ink-2` | `#54483c` | Chữ phụ |
| `--rims-ink-3` | `#6d6053` | Chữ mờ, nhãn |
| `--rims-brand` | `#b02a1f` | Đỏ son — nhấn, hành động chính |
| `--rims-brand-hover` | `#8f2018` | Trạng thái rê chuột |
| `--rims-ink-on-brand` | `#fdf6f4` | Chữ trên nền đỏ son |
| `--rims-ok` | `#2f6b3f` | Xong, đang bán, bàn trống |
| `--rims-busy` | `#8a5a12` | Đang làm, đang phục vụ, đã đặt |
| `--rims-alert` | `#a3231c` | Huỷ, lỗi, quá hạn |

### Chế độ tối

| Vai trò | Giá trị |
|---|---|
| `--rims-paper` | `#191512` |
| `--rims-surface` | `#211c18` |
| `--rims-surface-2` | `#2a241f` |
| `--rims-surface-3` | `#332c26` |
| `--rims-line` | `#3a322b` |
| `--rims-line-strong` | `#8a7b67` |
| `--rims-ink` | `#f2ece3` |
| `--rims-ink-2` | `#c8bdae` |
| `--rims-ink-3` | `#a2968a` |
| `--rims-brand` | `#e8735f` |
| `--rims-brand-hover` | `#f18e7c` |
| `--rims-ink-on-brand` | `#2b120e` |
| `--rims-ok` | `#6cbb7f` |
| `--rims-busy` | `#e0a74a` |
| `--rims-alert` | `#ef8177` |

**Đã kiểm 30 cặp chữ/nền ở cả hai chế độ: 0 cặp dưới ngưỡng WCAG AA.**
Ngưỡng dùng: 4.5:1 cho chữ, 3:1 cho viền và thành phần phi văn bản.

### Luật màu

- **Nhấn không quá 5% mỗi khung nhìn.** Đỏ son dành cho hành động chính và dấu
  hiệu vị trí hiện tại, không rải lên trang trí.
- **Nhấn và cảnh báo phân biệt bằng HÌNH DẠNG, không bằng màu.** Cả hai đều đỏ.
  Nút chính **tô đầy** đỏ son; nút phá huỷ **chỉ có viền**, nền trong suốt.
  Người không phân biệt được sắc đỏ vẫn đọc đúng nhờ độ đầy.
- **Trạng thái không bao giờ chỉ mang màu.** Mọi chip trạng thái đều có chữ.
  Màu là lớp thứ hai.
- Ba màu trạng thái (`ok` / `busy` / `alert`) không dùng cho hành động, chỉ dùng
  cho trạng thái dữ liệu.

## Typography

| Vai trò | Mặt chữ | Cân nặng |
|---|---|---|
| Display | Be Vietnam Pro | 700 |
| Thân | Be Vietnam Pro | 400 · 500 · 600 |
| Số & mã | JetBrains Mono | 400 · 500 · 700 |

Giữ nguyên hai mặt chữ đang dùng. **Ràng buộc cứng: giao diện toàn tiếng Việt,
mặt chữ phải đủ dấu.** Be Vietnam Pro do người Việt thiết kế, dấu đặt đúng chỗ ở
mọi cân nặng; JetBrains Mono có subset vietnamese. Đã loại Instrument Sans vì
thiếu dấu.

- Display roman, **không bao giờ nghiêng**.
- Tiêu đề màn: `clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)`.
- Chữ nghiêng chỉ dùng để nhấn trong đoạn văn xuôi, không dùng cho tiêu đề.
- Mọi con số trong bảng, tiền, giờ, mã đơn: `font-variant-numeric: tabular-nums`.
- Nhãn nhỏ in hoa có giãn chữ `0.06em`; chữ thường không giãn.

## Spacing

Thang 4pt đặt tên, giá trị nằm trong `tokens.css`. Màn phải dùng tên
(`var(--rims-space-4)`), không gõ số thô.

Nhịp trang: `--rims-space-6` (24px) giữa các khối ở màn hẹp, `--rims-space-8`
(32px) từ 60rem trở lên.

## Hình khối

- **Bo góc 0px** cho thẻ, phiếu, bảng, ô nhập, chip. Đây là chữ ký của hệ.
- **2px** cho nút — đủ để tay chạm thấy là nút, chưa đủ để thành viên thuốc.
- Kẻ phân cách giữa các mục trong danh sách: **đứt đoạn** `1px dashed`.
- Kẻ khung ngoài và kẻ bảng: **liền** `1px solid`.
- Mục có trạng thái: **vạch trái 3px** đặc, màu theo trạng thái.
- **Không đổ bóng ở đâu cả.** Độ sâu do kẻ và nền tạo ra, không do bóng.

## Responsive

Mobile-first, không có ngoại lệ.

- Base style viết cho khung hẹp nhất. Chỉ dùng `min-width`, **cấm** `max-width`
  làm hướng chính.
- Điểm ngắt bằng `rem`, đặt ở chỗ nội dung vỡ: `36rem` · `48rem` · `60rem` · `90rem`.
- `html` và `body` mang `overflow-x: clip`, không phải `hidden`.
- Chiều cao dùng `dvh`, không dùng `vh`.
- Track lưới chứa ảnh dùng `minmax(0, 1fr)` hoặc `minmax(min(Npx, 100%), 1fr)`,
  không bao giờ để `minmax(Npx, 1fr)` trần.
- `@media (pointer: coarse)` nâng mọi vùng chạm lên **tối thiểu 48px**.
- Nhãn bấm được không bao giờ xuống hai dòng: `white-space: nowrap`, để khung cha
  xuống dòng chứ không để nhãn xuống dòng.
- Hàng bộ lọc và hàng chip luôn `flex-wrap: wrap`.
- Bảng rộng hơn khung luôn nằm trong hộp cuộn ngang có `tabindex="0"`.

Mỗi lần sửa xong đều đo lại ở **320 / 375 / 414 / 768 / 1024 / 1440**.

## Motion

Dự án **motion-cut** — không cài thư viện animation nào, và sẽ không cài.

- Chỉ hoạt hoạ `transform` và `opacity`.
- Ba easing đặt tên: `--rims-ease-out` · `--rims-ease-in` · `--rims-ease-in-out`.
  Không dùng `ease` mặc định, không nảy, không vọt quá.
- Thời lượng: `--rims-dur-short` 140ms cho phản hồi chạm, `--rims-dur-base` 200ms
  cho chuyển lớp. Ngăn kéo 220ms.
- `prefers-reduced-motion: reduce` → mọi chuyển động không gian rút về mờ dần
  ≤150ms.
- **Vòng focus hiện tức thì, không bao giờ hoạt hoạ.**

## Microinteractions

- **Thành công im lặng.** Lưu xong thì dữ liệu đổi tại chỗ; không bắn toast ăn mừng.
  Toast chỉ dành cho việc xảy ra ngoài tầm mắt (bếp báo món mới, bàn đổi trạng thái).
- **Hành động đảo được thì làm ngay + cho Hoàn tác**, không hỏi lại bằng hộp thoại.
  Hộp thoại xác nhận chỉ dành cho việc không đảo được: xoá bản ghi, huỷ đơn đã nấu.
- Tooltip: rê chuột chờ 800ms, focus bàn phím hiện 0ms.
- Không có tương tác nào chỉ chạy được bằng rê chuột.

## CTA voice

- **Chính**: tô đầy `--rims-brand`, chữ `--rims-ink-on-brand`, bo 2px, chữ 600.
  Nhãn là **động từ + tân ngữ ngắn**: "Xong món", "Lưu đặt bàn", "Thanh toán".
- **Phụ**: nền `--rims-surface-2`, viền `--rims-line`, chữ `--rims-ink`.
- **Phá huỷ**: nền trong suốt, viền `--rims-alert`, chữ `--rims-alert`. Không bao
  giờ tô đầy.
- Một màn có **đúng một** nút chính. Nhiều hơn nghĩa là màn đang làm nhiều việc.

### Ngoại lệ có ghi: hành động "xong" ở màn vận hành

Ở hàng đợi bếp và sơ đồ bàn, hành động chính là **hoàn thành một việc**, và xanh
lá cho "xong" là quy ước nghề mạnh hơn bất kỳ hệ màu nào. Đầu bếp quét mắt qua
mười phiếu để tìm nút bấm, không đọc nhãn.

Nên `rk-btn--go` (tô đầy `--rims-ok`) **được** làm nút chính trên màn vận hành,
thay cho đỏ son. Đây là ngoại lệ duy nhất, và chỉ ở họ Vận hành.

Đỏ son vẫn là nút chính ở mọi chỗ khác: lưu biểu mẫu, tạo bản ghi, thanh toán.
Nút phá huỷ vẫn chỉ có viền, không bao giờ tô đầy — nên ba loại nút vẫn phân
biệt được bằng hình dạng: tô đỏ (làm), tô xanh (xong), viền đỏ (bỏ).

## Cho phép theo họ

- **Công khai** được dùng enrichment, tối đa Tier-B (SVG dựng tay). Không ảnh stock.
- **Vận hành** *không* được enrichment. Chức năng gánh màn.
- **Quản trị** chỉ typography và bảng.

## Điều mọi màn PHẢI dùng chung

- Mặt chữ display và thân.
- Màu nhấn và luật ≤5%.
- Giọng CTA: hình nút, bo góc, nhịp padding.
- Bo góc 0px cho bề mặt, kẻ đứt cho phân cách trong danh sách.
- Vùng chạm tối thiểu 48px trên thiết bị cảm ứng.
- Thanh bên N3 và ngăn kéo dưới 60rem.

## Điều màn ĐƯỢC khác nhau

- Macrostructure trong phạm vi họ của nó.
- Bề mặt dữ liệu: bảng, danh sách thẻ, hay sơ đồ bàn.
- Vị trí hành động chính: trên đầu màn, hay thanh dính đáy ở khung hẹp.
- Có hay không dải thống kê đầu màn.

---

## Exports

### tokens.css

Nguồn thật nằm ở `frontend/src/styles/tokens.css`. Đoạn dưới là phần cốt lõi để
mang sang dự án khác.

```css
:root {
    --color-paper: #faf6ef;
    --color-surface: #fffdf8;
    --color-surface-2: #f2ece1;
    --color-ink: #2b2118;
    --color-ink-2: #54483c;
    --color-ink-3: #6d6053;
    --color-rule: #e0d5c2;
    --color-rule-strong: #8a7b67;
    --color-accent: #b02a1f;
    --color-accent-ink: #fdf6f4;
    --color-focus: #b02a1f;
    --color-ok: #2f6b3f;
    --color-busy: #8a5a12;
    --color-alert: #a3231c;

    --font-display: 'Be Vietnam Pro', system-ui, sans-serif;
    --font-body: 'Be Vietnam Pro', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, monospace;

    --space-3xs: 0.25rem;
    --space-2xs: 0.5rem;
    --space-xs: 0.75rem;
    --space-sm: 1rem;
    --space-md: 1.5rem;
    --space-lg: 2rem;
    --space-xl: 3rem;

    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --dur-short: 140ms;
    --dur-base: 200ms;

    --radius-surface: 0px;
    --radius-control: 2px;
}
```

### Tailwind v4 `@theme`

```css
@theme {
    --color-paper: #faf6ef;
    --color-ink: #2b2118;
    --color-accent: #b02a1f;
    --font-display: 'Be Vietnam Pro', sans-serif;
    --font-body: 'Be Vietnam Pro', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --spacing-md: 1.5rem;
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --radius-none: 0px;
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper":  { "$value": "#faf6ef", "$type": "color" },
    "ink":    { "$value": "#2b2118", "$type": "color" },
    "accent": { "$value": "#b02a1f", "$type": "color" },
    "ok":     { "$value": "#2f6b3f", "$type": "color" },
    "busy":   { "$value": "#8a5a12", "$type": "color" },
    "alert":  { "$value": "#a3231c", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Be Vietnam Pro", "$type": "fontFamily" },
    "body":    { "$value": "Be Vietnam Pro", "$type": "fontFamily" },
    "mono":    { "$value": "JetBrains Mono", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1.5rem", "$type": "dimension" }
  },
  "radius": {
    "surface": { "$value": "0px", "$type": "dimension" },
    "control": { "$value": "2px", "$type": "dimension" }
  }
}
```
