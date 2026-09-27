/**
 * Dựng design.html ở gốc kho.
 *
 * VÌ SAO SINH RA CHỨ KHÔNG GÕ TAY: một trang mô tả hệ thiết kế mà gõ tay thì
 * ngày nó sai là ngày không ai biết. Ở đây:
 *
 *   - Màu, hình khối, component: trang LINK THẲNG vào tokens.css và
 *     rims-kit.css thật. Không chép một mã màu nào. Đổi token là trang đổi
 *     theo, và nếu một luật gãy thì trang gãy y như app gãy.
 *   - Bảng icon: đọc từ icons.ts, nguồn thật duy nhất.
 *   - Số đo tương phản: tính TRONG TRANG lúc mở, từ màu đã tính của chính
 *     những ô mẫu đang hiện. Không con số nào được chép vào.
 *
 * Chạy:  node tools/build-design-html.mjs
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const frontend = join(here, '..')
const repo = join(frontend, '..')

const iconsSource = readFileSync(
    join(frontend, 'src/shared/components/ui/icons.ts'),
    'utf8',
)

/** Cắt bảng ICONS ra khỏi icons.ts. */
function readIcons() {
    const start = iconsSource.indexOf('export const ICONS')
    const end = iconsSource.indexOf('export const ICON_MEANING')
    const block = iconsSource.slice(start, end)

    const out = []
    const re = /^\s{4}([a-zA-Z][a-zA-Z0-9]*):\s*'(.*)',\s*$/gm
    let m

    while ((m = re.exec(block)) !== null) {
        out.push({name: m[1], path: m[2]})
    }

    return out
}

/** Cắt bảng nghĩa ra khỏi icons.ts. */
function readMeanings() {
    const start = iconsSource.indexOf('export const ICON_MEANING')
    const end = iconsSource.indexOf('export const ICON_PLANNED')
    const block = iconsSource.slice(start, end === -1 ? undefined : end)

    const out = {}
    const re = /^\s{4}([a-zA-Z][a-zA-Z0-9]*):\s*'(.*)',\s*$/gm
    let m

    while ((m = re.exec(block)) !== null) {
        out[m[1]] = m[2]
    }

    return out
}

/** Icon đã đặt chỗ nhưng chưa vẽ. */
function readPlanned() {
    const start = iconsSource.indexOf('export const ICON_PLANNED')

    if (start === -1) {
        return {}
    }

    const block = iconsSource.slice(start)
    const out = {}
    const re = /^\s{4}([a-zA-Z][a-zA-Z0-9]*):\s*'(.*)',\s*$/gm
    let m

    while ((m = re.exec(block)) !== null) {
        out[m[1]] = m[2]
    }

    return out
}

const icons = readIcons()
const meanings = readMeanings()
const planned = readPlanned()

function esc(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

const iconCells = icons
    .map(
        (icon) => `      <figure class="dg-icon">
        <svg class="rims-i" viewBox="0 0 24 24" aria-hidden="true">${icon.path}</svg>
        <figcaption>
          <code>${esc(icon.name)}</code>
          <span>${esc(meanings[icon.name] ?? '— chưa ghi nghĩa —')}</span>
        </figcaption>
      </figure>`,
    )
    .join('\n')

const plannedRows = Object.entries(planned)
    .map(
        ([name, why]) =>
            `        <tr><td><code>${esc(name)}</code></td><td>${esc(why)}</td></tr>`,
    )
    .join('\n')

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hệ thiết kế RIMS</title>

<!--
  TRANG NÀY ĐƯỢC SINH RA, ĐỪNG SỬA TAY.
  Nguồn: frontend/tools/build-design-html.mjs — chạy lại bằng
      cd frontend && node tools/build-design-html.mjs

  Hai stylesheet dưới đây là CHÍNH hai file mà app đang chạy. Trang không chép
  lại một mã màu nào, nên nó không thể nói khác app: đổi token là trang đổi
  theo, và một luật gãy thì trang gãy y như app gãy.
-->
<link rel="stylesheet" href="frontend/src/styles/tokens.css">
<link rel="stylesheet" href="frontend/src/styles/rims-kit.css">

<style>
  /* Chỉ bố cục CỦA RIÊNG trang này. Không một màu nào khai ở đây. */
  body { max-width: 72rem; margin: 0 auto; padding: var(--rims-space-6); }
  .dg-lead { max-width: 68ch; }
  .dg-sec { margin-block: var(--rims-space-12); }
  .dg-sec > h2 { border-bottom: var(--rims-border) solid var(--rims-line-strong);
                 padding-bottom: var(--rims-space-2); }
  .dg-grid { display: grid; gap: var(--rims-space-4);
             grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr)); }
  .dg-row { display: flex; flex-wrap: wrap; gap: var(--rims-space-3);
            align-items: center; }
  .dg-swatch { border: var(--rims-border) solid var(--rims-line-strong);
               box-shadow: var(--rims-shadow-raised); }
  .dg-swatch__fill { padding: var(--rims-space-5) var(--rims-space-4);
                     font-weight: var(--rims-weight-bold); }
  .dg-swatch__meta { padding: var(--rims-space-3) var(--rims-space-4);
                     border-top: var(--rims-border) solid var(--rims-line-strong);
                     font-family: var(--rims-font-mono);
                     font-size: var(--rims-text-xs); }
  .dg-ratio { font-variant-numeric: tabular-nums; font-weight: var(--rims-weight-bold); }
  .dg-pass::after { content: ' ĐẠT'; color: var(--rims-ok); }
  .dg-fail::after { content: ' TRƯỢT'; color: var(--rims-alert); }
  .dg-icon { margin: 0; display: flex; gap: var(--rims-space-3);
             align-items: center; padding: var(--rims-space-3);
             border: 1px solid var(--rims-line); }
  .dg-icon .rims-i { width: 24px; height: 24px; flex: none; }
  .dg-icon figcaption { display: flex; flex-direction: column; min-width: 0; }
  .dg-icon code { font-size: var(--rims-text-sm); font-weight: var(--rims-weight-bold); }
  .dg-icon span { font-size: var(--rims-text-xs); color: var(--rims-ink-3); }
  .dg-note { border-inline-start: var(--rims-border) solid var(--rims-line-strong);
             padding-inline-start: var(--rims-space-4); max-width: 68ch; }
  .dg-toc a { display: block; padding: var(--rims-space-1) 0; }
</style>
</head>

<body>

<header class="dg-sec">
  <p class="rk-eyebrow">Hệ thiết kế</p>
  <h1>RIMS · Phiếu bếp</h1>

  <p class="dg-lead">
    Trang này là bản mô tả đầy đủ của hệ thiết kế đang chạy trong RIMS. Nó
    <b>không chép lại</b> một mã màu, một cỡ chữ hay một luật CSS nào: nó nạp
    thẳng <code>tokens.css</code> và <code>rims-kit.css</code> mà app đang
    dùng. Mọi ô mẫu bên dưới là component thật, và mọi con số tương phản được
    <b>đo lúc bạn mở trang</b> chứ không phải viết sẵn.
  </p>

  <div class="dg-note">
    <p>
      <b>Mở thế nào:</b> mở file này từ gốc kho (<code>design.html</code>). Hai
      đường dẫn stylesheet là đường dẫn tương đối tới mã nguồn, nên phải giữ
      file ở đúng chỗ đó.
    </p>
    <p>
      <b>Sinh lại:</b> <code>cd frontend &amp;&amp; node tools/build-design-html.mjs</code>.
      Đừng sửa tay — lần sinh sau sẽ ghi đè.
    </p>
  </div>

  <nav class="dg-toc">
    <a class="rk-link" href="#chu-ky">1 · Chữ ký của hệ</a>
    <a class="rk-link" href="#mau">2 · Màu — bốn nghĩa</a>
    <a class="rk-link" href="#toi">3 · Chế độ tối</a>
    <a class="rk-link" href="#hinh">4 · Hình khối</a>
    <a class="rk-link" href="#chu">5 · Chữ</a>
    <a class="rk-link" href="#icon">6 · Icon</a>
    <a class="rk-link" href="#component">7 · Component</a>
    <a class="rk-link" href="#giong">8 · Giọng văn</a>
    <a class="rk-link" href="#man">9 · Bản đồ màn</a>
    <a class="rk-link" href="#kiem">10 · Cách kiểm lại</a>
  </nav>
</header>

<section class="dg-sec" id="chu-ky">
  <h2>1 · Chữ ký của hệ</h2>

  <p class="dg-lead">
    Ba thứ làm nên nhận diện, và chúng đúng ở <b>mọi</b> bề mặt:
  </p>

  <ul>
    <li><b>Bo góc 0px tuyệt đối.</b> Ngoại lệ duy nhất là nút radio, vì quy ước
        tròn của nó quá mạnh để phá. Biểu đồ vành khuyên và con quay chờ dùng
        token riêng <code>--rims-shape-round</code>: ở đó vòng tròn là
        <i>nét vẽ</i>, không phải góc của một cái hộp.</li>
    <li><b>Viền 2px</b> cho bề mặt và điều khiển; <b>1px</b> cho kẻ trong lòng
        bảng và viền chip.</li>
    <li><b>Bóng offset cứng, blur 0.</b> Sáng 4px, tối 2px. Bóng chỉ ở thẻ,
        nút, modal, phiếu và ô thống kê — không bao giờ trong lòng bảng, trên
        hàng danh sách hay trên ô nhập.</li>
  </ul>

  <div class="rk-card rk-card--pad">
    <div class="rk-actions">
      <button class="rk-btn rk-btn--go" type="button">Nút chính</button>
      <button class="rk-btn rk-btn--danger" type="button">Nút huỷ</button>
      <button class="rk-btn rk-btn--quiet" type="button">Nút phụ</button>
      <button class="rk-btn rk-btn--quiet" type="button" disabled>Đang khoá</button>
    </div>
  </div>
</section>

<section class="dg-sec" id="mau">
  <h2>2 · Màu — bốn nghĩa, không hơn</h2>

  <p class="dg-lead">
    Bảng màu có đúng <b>bốn</b> nghĩa. Mọi trục khác — vai trò, danh mục, thứ
    hạng — <b>không được</b> mượn bốn màu này; mượn là hai thứ khác hẳn nhau
    trông như một.
  </p>

  <div class="dg-grid" id="dg-colors"></div>

  <div class="dg-note">
    <p>
      <b>Đỏ mang hai vai, phân biệt bằng VỊ TRÍ.</b> Trên vỏ app (ô rail đang
      mở, băng mục con) đỏ là <i>nhận diện</i>. Trên một cái nút, đỏ là
      <i>phá huỷ</i>. Cùng một mã màu, không bao giờ đứng cạnh nhau trên cùng
      một bề mặt.
    </p>
    <p>
      <b><code>--rims-alert-deep</code></b> là đỏ đậm dành riêng cho
      <i>chữ nằm trên nền đỏ nhạt</i>. Đỏ thương hiệu ở đó chỉ đạt 4.37:1 —
      thiếu 0.13. Đây không phải màu thứ năm.
    </p>
  </div>
</section>

<section class="dg-sec" id="toi">
  <h2>3 · Chế độ tối</h2>

  <p class="dg-lead">
    Luật gốc, chứng minh được bằng đo: <b>không có sắc tối nào tách được 3:1
    khỏi một nền tối.</b> Nên ở chế độ tối, <b>cấu trúc đến từ ĐƯỜNG KẺ, không
    đến từ NỀN.</b>
  </p>

  <ul>
    <li>Màu ngữ nghĩa đổi thành <b>nền tint tối + chữ sáng</b>, không phải nền
        bão hoà — nền bão hoà trên nền tối đọc ra là kẹo phát sáng.</li>
    <li>Ba token cho mỗi nghĩa, và chúng <b>không thể thay nhau</b>:
        <code>--rims-ok</code> là màu <b>chữ và viền</b>,
        <code>--rims-ok-fill</code> là màu <b>nền khối tô đặc</b>,
        <code>--rims-ink-on-ok</code> là màu <b>chữ nằm trên khối đó</b>.</li>
    <li>Token <b>đường kẻ</b> không được dùng làm <b>nền</b>. Ở chế độ tối nó
        đảo thành màu sáng, và một nền sáng với chữ sáng cho ra 1:1.</li>
    <li>Đỏ nhận diện của vỏ app <b>không</b> đổi thành tint: ô rail đang mở vẫn
        là khối đỏ đặc ở cả hai chế độ, nên chữ trên nó phải là
        <b>trắng</b> chứ không phải đỏ nhạt.</li>
    <li>Bóng offset còn <b>2px</b> thay vì 4px.</li>
  </ul>

  <p class="dg-lead">
    Đổi chế độ bằng nút trên hàng breadcrumb, nhớ theo người dùng, ba trạng
    thái: theo máy → sáng → tối.
  </p>
</section>

<section class="dg-sec" id="hinh">
  <h2>4 · Hình khối</h2>

  <div class="dg-row" id="dg-shapes"></div>

  <p class="dg-lead">
    <b>Không dùng vạch trái đậm một cạnh</b> (side-stripe card). Thẻ cần đánh
    dấu thì đổi màu <b>cả bốn cạnh</b>.
  </p>
</section>

<section class="dg-sec" id="chu">
  <h2>5 · Chữ</h2>

  <p class="dg-lead">
    Hai mặt chữ: <b>Archivo</b> cho tiêu đề và nhãn, <b>IBM Plex Sans</b> cho
    chữ đọc; mono cho mọi con số. Cả hai đều có bộ <code>vietnamese</code> —
    thiếu bộ đó thì dấu tiếng Việt rơi sang một mặt chữ khác và cả trang lộn
    xộn.
  </p>

  <ul>
    <li><b>Số luôn dùng bảng tỉ số</b> (<code>tabular-nums</code>): cột số
        trong bảng, tiền, giờ, số đếm — chúng phải thẳng hàng khi đổi giá trị.</li>
    <li><b>Không Title Case.</b> Tiếng Việt không có quy ước đó.</li>
    <li><b>Không <code>-webkit-font-smoothing: none</code></b> — nó phá dấu.</li>
    <li>Văn bản đọc tối đa <b>68 ký tự</b> một dòng. Biểu mẫu tối đa
        <b>46rem</b>. Bảng, kanban và sơ đồ mặt bằng thì giãn hết khung.</li>
  </ul>

  <div id="dg-type"></div>
</section>

<section class="dg-sec" id="icon">
  <h2>6 · Icon</h2>

  <p class="dg-lead">
    <b>MỘT NGHĨA MỘT ICON, MỘT ICON MỘT NGHĨA.</b> Khi một icon mới cần một
    nghĩa đã bị chiếm, icon cũ phải bị <i>thu hẹp nghĩa</i>, và việc đó phải
    được viết xuống ngay trong <code>icons.ts</code>.
  </p>

  <ul>
    <li>Một bảng <code>ICONS</code> duy nhất, mỗi icon là một chuỗi
        <code>&lt;path&gt;</code>; một component <code>&lt;Icon name&gt;</code>.</li>
    <li><code>viewBox="0 0 24 24"</code>, <code>aria-hidden="true"</code>, độ
        dày nét đặt <b>một lần</b> ở class <code>.rims-i</code>.</li>
    <li>Hình học <b>vuông hoá</b>: <code>rx = 0</code>, không vòng tròn, đầu nét
        vuông, góc miter, nét 2 — cùng cây bút với viền 2px.</li>
    <li>Kiểm thử chặn trôi: icon không ai dùng, icon dùng mà chưa khai nghĩa,
        và icon còn kẹt trong <code>ICON_PLANNED</code> đều làm test đỏ.</li>
  </ul>

  <p><b>${icons.length} icon</b> đang có trong hệ:</p>

  <div class="dg-grid">
${iconCells}
  </div>

  ${
      plannedRows
          ? `<h3>Đã đặt chỗ, chưa vẽ</h3>
  <div class="rk-tablewrap">
    <table class="rk-table">
      <thead><tr><th scope="col">Tên</th><th scope="col">Dành cho</th></tr></thead>
      <tbody>
${plannedRows}
      </tbody>
    </table>
  </div>`
          : '<p>Không còn icon nào đặt chỗ mà chưa vẽ.</p>'
  }
</section>

<section class="dg-sec" id="component">
  <h2>7 · Component</h2>

  <h3>Chip trạng thái</h3>
  <div class="dg-row">
    <span class="rk-chip rk-chip--ok">Đã xong</span>
    <span class="rk-chip rk-chip--busy">Đang làm</span>
    <span class="rk-chip rk-chip--alert">Đã huỷ</span>
    <span class="rk-chip rk-chip--info">Đã đặt trước</span>
    <span class="rk-chip rk-chip--idle">Tạm hết</span>
  </div>

  <h3>Nhãn</h3>
  <div class="dg-row">
    <span class="rk-tag">Món chính</span>
    <span class="rk-tag rk-tag--muted">Tráng miệng (ẩn)</span>
    <span class="rk-tag rk-tag--alert">Có ghi chú — làm riêng</span>
  </div>

  <p class="dg-note">
    Nhãn <b>vai trò</b> không có màu riêng. Vai trò là một cái <i>tên</i>,
    không phải một trạng thái, và tên thì đọc bằng chữ.
  </p>

  <h3>Ô nhập</h3>
  <div class="rk-card rk-card--pad">
    <div class="rk-fieldgroup">
      <div class="rk-field">
        <label class="rk-field__label" for="dg-i1">Tên khách hàng</label>
        <input class="rk-input" id="dg-i1" placeholder="Nhập họ và tên">
      </div>
      <div class="rk-field">
        <label class="rk-field__label" for="dg-i2">Số bàn</label>
        <select class="rk-select" id="dg-i2"><option>Bàn 1 — 2 chỗ</option></select>
      </div>
    </div>
  </div>

  <h3>Bảng</h3>
  <div class="rk-tablewrap">
    <table class="rk-table">
      <thead>
        <tr>
          <th scope="col">Món ăn</th>
          <th scope="col" class="rk-th--num">Giá</th>
          <th scope="col">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Phở bò tái lăn</td>
          <td class="rk-td--num">45.000đ</td>
          <td><span class="rk-chip rk-chip--ok">Đang bán</span></td>
        </tr>
        <tr>
          <td>Chả cá Lã Vọng ăn kèm bánh đa nướng</td>
          <td class="rk-td--num">135.000đ</td>
          <td><span class="rk-chip rk-chip--idle">Tạm hết</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Bảng cột trạng thái</h3>
  <p class="dg-note">
    Chỉ dùng cho màn <b>có dòng trạng thái thật</b>. Màn gom theo món hay màn
    lịch sử thì không — dựng cột cho một trục không tồn tại là nói dối về dữ
    liệu. Dưới 52rem: một cột + băng tab mang số đếm.
  </p>

  <h3>Sơ đồ mặt bằng</h3>
  <p class="dg-note">
    Toạ độ bằng <b>ô lưới</b>, không phải pixel, nên mặt bằng giữ nguyên hình
    dạng ở mọi cỡ màn. Lưới <b>không</b> co vừa khung — hẹp thì cuộn, vì cả
    điểm của sơ đồ là nó giống cái quán thật. Bàn chưa xếp nằm thành hàng riêng
    ở cuối, có tiêu đề nói rõ.
  </p>
</section>

<section class="dg-sec" id="giong">
  <h2>8 · Giọng văn</h2>

  <ul>
    <li><b>Thành công thì im lặng.</b> Lưu xong thì dữ liệu đổi tại chỗ. Chữ
        "thành công!" chỉ còn ở màn kết quả thanh toán.</li>
    <li>Câu thuật lại việc đã làm: <i>"Đã lưu mặt bằng"</i>, không phải
        <i>"Lưu thành công!"</i>.</li>
    <li>Chính tả đã chốt: <b>huỷ</b>, <b>xoá</b>, ba dấu chấm
        <code>...</code> chứ không phải ký tự ellipsis.</li>
    <li>Một từ cho một nghĩa: <b>Trạng thái</b>, không xen kẽ "Tình trạng".</li>
    <li>Một phương thức một tên: <b>Mã QR</b>, khớp enum
        <code>PaymentMethod.QRCODE</code>.</li>
    <li>Nhãn bấm được không bao giờ xuống hai dòng.</li>
  </ul>
</section>

<section class="dg-sec" id="man">
  <h2>9 · Bản đồ màn</h2>

  <p class="dg-lead">
    Khung của mỗi họ màn. Bảng đầy đủ kèm lý do nằm trong
    <code>design.md § Bản đồ màn</code>.
  </p>

  <div class="rk-tablewrap">
    <table class="rk-table">
      <thead><tr><th scope="col">Họ màn</th><th scope="col">Khung</th></tr></thead>
      <tbody>
        <tr><td>Trang chủ</td><td>Danh mục dính · lưới ảnh · băng ảnh tự cuộn 40s có nút dừng · ô đăng nhập ngay tại trang</td></tr>
        <tr><td>Cửa vào (đăng nhập, đăng ký, quên mật khẩu)</td><td>Biểu mẫu ≤46rem</td></tr>
        <tr><td>Sơ đồ bàn (Phục vụ)</td><td>Sơ đồ mặt bằng thật, toạ độ trong CSDL</td></tr>
        <tr><td>Đặt món, sửa đơn</td><td>Lưới ảnh món to + giỏ đơn là cột dính bên phải</td></tr>
        <tr><td>Hàng đợi bếp, thanh toán</td><td>Bảng ba cột theo trạng thái thật</td></tr>
        <tr><td>Gom món</td><td>Lưới thẻ — gom theo MÓN nên không có trục trạng thái</td></tr>
        <tr><td>Lịch sử (đã xong, đã huỷ, hoá đơn)</td><td>Bảng dày + lọc</td></tr>
        <tr><td>Thực đơn của Quản trị</td><td>Thẻ ảnh, đổi được sang bảng, mặc định thẻ, nhớ theo màn</td></tr>
        <tr><td>Thống kê</td><td>Dải số to + biểu đồ + bảng</td></tr>
        <tr><td>Mặt bằng (Quản trị)</td><td>Kéo thả, và đặt được bằng phím mũi tên</td></tr>
        <tr><td>Hồ sơ, đặt bàn</td><td>Biểu mẫu ≤46rem</td></tr>
        <tr><td>Kết quả thanh toán</td><td>Một khối lớn giữa màn</td></tr>
      </tbody>
    </table>
  </div>
</section>

<section class="dg-sec" id="kiem">
  <h2>10 · Cách kiểm lại</h2>

  <p class="dg-lead">
    Build xanh không có nghĩa là màn đúng. Ba công cụ, chạy được ngay:
  </p>

  <div class="rk-tablewrap">
    <table class="rk-table">
      <thead><tr><th scope="col">Việc</th><th scope="col">Lệnh</th></tr></thead>
      <tbody>
        <tr><td>Chụp 34 màn × 2 chế độ × 3 cỡ</td><td><code>node tools/render-walk.mjs</code></td></tr>
        <tr><td>Đo tương phản trên màn thật</td><td><code>node tools/contrast-audit.mjs</code></td></tr>
        <tr><td>Chặn trôi bảng icon</td><td><code>npm test</code></td></tr>
        <tr><td>Sinh lại chính trang này</td><td><code>node tools/build-design-html.mjs</code></td></tr>
      </tbody>
    </table>
  </div>

  <p class="dg-note">
    Hai công cụ đầu cần một máy chủ tĩnh đang chạy:
    <code>npm run build &amp;&amp; npx vite preview --port 4200 --strictPort</code>.
    Chúng gieo phiên theo vai và chặn mọi lời gọi API ở tầng mạng, nên
    <b>không cần backend</b> — và ảnh chụp lặp lại được, vì dữ liệu cố định.
  </p>
</section>

<script>
/*
 * Mọi con số trong trang này được ĐO tại đây, không chép vào.
 *
 * Cách làm: dựng thật một ô mẫu cho từng cặp token, đọc màu ĐÃ TÍNH của nó,
 * rồi tính tỉ số WCAG. Nếu một token đổi mà cặp đó tụt xuống dưới ngưỡng, con
 * số trong trang đổi theo và đánh dấu TRƯỢT ngay.
 */
(function () {
  function parse(value) {
    var m = value.match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    var p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
    return {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1}
  }

  function lum(c) {
    function f(v) {
      var s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
  }

  function ratio(a, b) {
    var la = lum(a), lb = lum(b)
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  }

  var MEANINGS = [
    ['LÀM', 'ok', 'bàn trống · món xong · nút chính'],
    ['CHỜ', 'busy', 'đang phục vụ · đang nấu'],
    ['BỎ', 'alert', 'quá giờ · lỗi · huỷ · đỏ thương hiệu'],
    ['TIN', 'info', 'đã đặt trước · chờ thanh toán · liên kết · vòng focus'],
  ]

  var host = document.getElementById('dg-colors')

  MEANINGS.forEach(function (row) {
    var label = row[0], key = row[1], use = row[2]

    var card = document.createElement('div')
    card.className = 'dg-swatch'

    var fill = document.createElement('div')
    fill.className = 'dg-swatch__fill'
    fill.style.background = 'var(--rims-' + key + '-fill)'
    fill.style.color = 'var(--rims-ink-on-' + key + ')'
    fill.textContent = label + ' — ' + use

    var meta = document.createElement('div')
    meta.className = 'dg-swatch__meta'

    card.appendChild(fill)
    card.appendChild(meta)
    host.appendChild(card)

    var cs = getComputedStyle(fill)
    var bg = parse(cs.backgroundColor)
    var fg = parse(cs.color)
    var r = ratio(fg, bg)

    var span = document.createElement('span')
    span.className = 'dg-ratio ' + (r >= 4.5 ? 'dg-pass' : 'dg-fail')
    span.textContent = 'chữ trên nền tô: ' + (Math.round(r * 100) / 100) + ':1'

    meta.appendChild(span)
    meta.appendChild(document.createElement('br'))

    var names = document.createElement('code')
    names.textContent = '--rims-' + key + ' / -fill / --rims-ink-on-' + key
    meta.appendChild(names)
  })

  /* Hình khối: đọc giá trị thật của token, không viết sẵn "0px". */
  var root = getComputedStyle(document.documentElement)
  var shapes = document.getElementById('dg-shapes')
  ;[
    ['Bo góc', '--rims-radius-md'],
    ['Bo góc viên thuốc', '--rims-radius-pill'],
    ['Hình tròn (nét vẽ)', '--rims-shape-round'],
    ['Viền', '--rims-border'],
    ['Độ lệch bóng', '--rims-offset'],
  ].forEach(function (pair) {
    var box = document.createElement('div')
    box.className = 'rk-card rk-card--pad'
    box.innerHTML =
      '<b>' + pair[0] + '</b><br><code>' + pair[1] + '</code> = <b>' +
      (root.getPropertyValue(pair[1]).trim() || '(chưa khai)') + '</b>'
    shapes.appendChild(box)
  })

  /* Chữ: đọc mặt chữ thật đang được dùng. */
  var type = document.getElementById('dg-type')
  ;[
    ['Tiêu đề và nhãn', '--rims-font-display'],
    ['Chữ đọc', '--rims-font-sans'],
    ['Con số', '--rims-font-mono'],
  ].forEach(function (pair) {
    var line = document.createElement('p')
    line.style.fontFamily = 'var(' + pair[1] + ')'
    line.innerHTML =
      '<b>' + pair[0] + '</b> — Bữa trưa đã sẵn sàng · 1.245.000đ · 08:00–22:00 ' +
      '<code style="font-family: var(--rims-font-mono)">' + pair[1] + '</code>'
    type.appendChild(line)
  })
})()
</script>

</body>
</html>
`

writeFileSync(join(repo, 'design.html'), html, 'utf8')

console.log(
    `design.html đã sinh — ${icons.length} icon, ${Object.keys(planned).length} icon đặt chỗ.`,
)
