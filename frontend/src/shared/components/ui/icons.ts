// ============================================================================
// RIMS · bảng ICONS — 30 icon
// Cơ chế học từ theme qlcv-aura của dự án kpi-manage: một bảng hằng, mỗi icon chỉ
// là chuỗi <path>, không có <svg> bọc. viewBox 24. Độ dày nét và kiểu đầu nét đặt
// MỘT LẦN ở class .rims-i trong tokens.css, không bao giờ viết trong từng icon.
//
// Hình học vuông hoá cho RIMS: rx = 0, không vòng tròn, đầu nét vuông, góc miter.
// Đây là chỗ RIMS lệch khỏi qlcv-aura — hệ đó vẽ theo họ Lucide (rx 2, vòng tròn,
// đầu nét tròn), còn RIMS đã chốt bo góc 0 và viền 2px đầu vuông.
//
// LUẬT GỐC, lấy nguyên từ qlcv-aura:
//   MỘT NGHĨA MỘT ICON, MỘT ICON MỘT NGHĨA.
// Khi một icon mới cần một nghĩa đã bị chiếm, icon cũ phải bị THU HẸP NGHĨA và
// việc đó phải được viết xuống ngay tại đây. Comment gỡ trùng là phần của hợp đồng,
// không phải chú thích cho vui.
//
// Chip trạng thái KHÔNG dùng icon — đã có ký hiệu chữ riêng (xem design.md § Chip).
// Món ăn KHÔNG có icon — đã có 43 ảnh thật trong frontend/public/image.
// ============================================================================

export const ICONS = {
    // ---- Rail: 4 nhóm của Quản trị ----
    chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="8" fill="currentColor" stroke="none"/><rect x="12" y="8" width="3" height="12" fill="currentColor" stroke="none"/><rect x="17" y="14" width="3" height="6" fill="currentColor" stroke="none"/>',
    kitchen: '<path d="M3 10h18l-2 11H5z"/><path d="M8 6V2M12 6V2M16 6V2"/>',
    user: '<rect x="8" y="3" width="8" height="8"/><path d="M4 21v-3h16v3"/>',
    gear: '<rect x="9" y="9" width="6" height="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',

    // ---- Rail: mục của Phục vụ, Bếp, Thu ngân, Khách ----
    // Bàn ăn. Gỡ trùng 1: hình bốn ô vuông TỪNG dùng cho cả "xem dạng thẻ";
    // chế độ xem thẻ đã chuyển sang `cards`, nên `table` chỉ còn nghĩa bàn ăn.
    table: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
    // Phiếu bếp. Gỡ trùng 2: `ticket` CÓ KHUNG, `rows` không khung — đó là thứ
    // duy nhất phân biệt hai hình ở cỡ 17px.
    ticket: '<rect x="4" y="3" width="16" height="18"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    invoice: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-3-2z"/><path d="M9 8h6M9 12h6"/>',
    booking: '<rect x="3" y="5" width="18" height="16"/><path d="M8 2v5M16 2v5M3 11h18"/><rect x="10" y="14" width="4" height="4" fill="currentColor" stroke="none"/>',

    // ---- Hành động ----
    // Gỡ trùng 3: `check` TỪNG mang ba nghĩa — nút "Xong món", chip "Đã xong",
    // hộp kiểm. Nay chỉ còn hai: NÚT và HỘP KIỂM. Chip trạng thái dùng ký hiệu chữ.
    check: '<path d="M4 13l5 5L20 6"/>',
    // Gỡ trùng 4a: HUỶ — bỏ việc đang dở, bản ghi vẫn còn, chỉ đổi trạng thái.
    ban: '<rect x="3" y="3" width="18" height="18"/><path d="M5 5l14 14"/>',
    // Gỡ trùng 4b: `x` ĐÃ BỊ THU HẸP còn đúng nghĩa ĐÓNG. Không bao giờ dùng cho huỷ.
    x: '<path d="M5 5l14 14M19 5L5 19"/>',
    // Gỡ trùng 4c: XOÁ — mất hẳn khỏi hệ thống. Khác `ban`.
    trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    pen: '<path d="M4 20h5L20 9l-5-5L4 15z"/><path d="M14 5l5 5"/>',
    save: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
    print: '<path d="M7 8V3h10v5M7 18H4v-8h16v8h-3"/><path d="M7 14h10v7H7z"/>',
    search: '<rect x="3" y="3" width="14" height="14"/><path d="M17 17l4 4"/>',
    // Thu phóng sơ đồ mặt bằng. CÙNG HỌ với `search` — kính lúp vuông, thêm
    // dấu bên trong. KHÔNG mượn `plus`/`minus`: `plus` đã mang nghĩa "thêm một
    // bản ghi", và một icon hai nghĩa là thứ luật gốc cấm.
    zoomIn: '<rect x="3" y="3" width="14" height="14"/><path d="M10 6v8M6 10h8"/><path d="M17 17l4 4"/>',
    zoomOut: '<rect x="3" y="3" width="14" height="14"/><path d="M6 10h8"/><path d="M17 17l4 4"/>',

    // ---- Điều hướng ----
    back: '<path d="M20 12H5M11 6L5 12l6 6"/>',
    prev: '<path d="M15 5L8 12l7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',

    // ---- Bảng ----
    sort: '<path d="M4 6h11M4 12h7M4 18h4"/><path d="M16 15l3 3 3-3M19 18V6"/>',
    filter: '<path d="M3 4h18l-7 8v8l-4-2v-6z"/>',
    // Chế độ xem thẻ — hai dải ngang. Cố ý KHÔNG giống `table` bốn ô.
    cards: '<rect x="3" y="3" width="18" height="7"/><rect x="3" y="14" width="18" height="7"/>',
    // Chế độ xem bảng — bốn vạch TRẦN, không khung. Cố ý KHÔNG giống `ticket`.
    rows: '<path d="M3 5h18M3 10h18M3 15h18M3 20h18"/>',

    // ---- Vỏ app ----
    clock: '<rect x="3" y="3" width="18" height="18"/><path d="M12 7v5l4 3"/>',
    // Quá hạn. Cùng họ đồng hồ với `clock` — đúng cách qlcv-aura làm clockAlert,
    // để mọi nhãn về hạn đọc ra là cùng một họ.
    clockAlert: '<rect x="3" y="3" width="14" height="14"/><path d="M10 7v4l3 2"/><path d="M20 12v5M20 20v.01"/>',
    sun: '<rect x="8" y="8" width="8" height="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a8 8 0 1 0 11 11z"/>',
    contrast: '<rect x="3" y="3" width="18" height="18"/><path d="M12 3v18h9V3z" fill="currentColor" stroke="none"/>',
    // ---- Thêm ở pha P4, sau khi soát 56 icon lucide đang vẽ trong app ----
    // Mỗi cái dưới đây là một nghĩa THẬT mà bộ 30 ban đầu chưa có. Cái nào trùng
    // nghĩa với icon sẵn có thì đã ánh xạ chứ không thêm — xem design.md.
    alert: '<path d="M12 3L2 21h20z"/><path d="M12 10v5M12 18v.01"/>',
    eye: '<path d="M2 12l4-5h12l4 5-4 5H6z"/><rect x="9" y="9" width="6" height="6"/>',
    eyeOff: '<path d="M2 12l4-5h12l4 5-4 5H6z"/><rect x="9" y="9" width="6" height="6"/><path d="M3 3l18 18"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    logout: '<path d="M10 21H4V3h6"/><path d="M15 7l5 5-5 5M20 12H9"/>',
    key: '<rect x="3" y="8" width="8" height="8"/><path d="M11 12h10M18 12v4M21 12v3"/>',
    bell: '<path d="M5 18h14l-2-4V9a5 5 0 0 0-10 0v5z"/><path d="M10 21h4"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15 6.7"/><path d="M3 21v-6h6"/><path d="M3 12a9 9 0 0 1 15-6.7"/><path d="M21 3v6h-6"/>',
} as const;

export type IconName = keyof typeof ICONS;

// Sổ nghĩa — nguồn thật cho bài test. Mỗi icon đúng một nghĩa, mỗi nghĩa đúng một icon.
export const ICON_MEANING: Record<IconName, string> = {
    chart: 'Bán hàng, thống kê, doanh thu',
    kitchen: 'Thực đơn, món, bếp',
    user: 'Tài khoản, người, hồ sơ',
    gear: 'Cấu hình nhà hàng',
    table: 'Bàn ăn',
    ticket: 'Phiếu bếp',
    invoice: 'Hoá đơn — chứng từ sau khi trả tiền',
    booking: 'Đặt bàn trước',
    check: 'Xong một việc (nút, hộp kiểm) — KHÔNG dùng cho chip trạng thái',
    ban: 'Huỷ — bỏ việc đang dở, bản ghi vẫn còn',
    x: 'Đóng — chỉ đóng, không mang nghĩa huỷ',
    trash: 'Xoá — mất hẳn khỏi hệ thống',
    plus: 'Thêm bản ghi mới',
    pen: 'Sửa',
    save: 'Lưu biểu mẫu',
    print: 'In hoá đơn',
    search: 'Tìm',
    zoomIn: 'Phóng to sơ đồ mặt bằng',
    zoomOut: 'Thu nhỏ sơ đồ mặt bằng',
    back: 'Quay lại màn trước',
    prev: 'Trang trước',
    next: 'Trang sau',
    menu: 'Mở ngăn kéo rail',
    sort: 'Sắp xếp — một icon, ba trạng thái',
    filter: 'Lọc',
    cards: 'Chế độ xem thẻ',
    rows: 'Chế độ xem bảng',
    clock: 'Giờ hiện tại',
    clockAlert: 'Quá hạn',
    sun: 'Ca sáng và ca chiều',
    moon: 'Ca tối',
    contrast: 'Đổi sáng / tối',
    alert: 'Cảnh báo — việc cần chú ý ngay, chưa phải lỗi',
    eye: 'Hiện mật khẩu',
    eyeOff: 'Ẩn mật khẩu',
    download: 'Tải tệp về — hoá đơn PDF',
    logout: 'Đăng xuất',
    key: 'Đổi mật khẩu',
    bell: 'Chuông báo món mới ở bếp',
    refresh: 'Làm mới dữ liệu trên màn',
};

/**
 * Icon đã khai nhưng CHƯA có chỗ dùng, kèm pha sẽ dùng.
 *
 * <p>Cổng test "không có icon nào không ai dùng" bỏ qua danh sách này. Không có
 * nó thì cổng chặn mọi việc khai trước; có nó mà không ghi lý do thì cổng mất
 * tác dụng. Nên mỗi dòng phải nói rõ pha nào sẽ dùng, và khi pha đó xong thì
 * XOÁ dòng tương ứng ở đây.
 */
export const ICON_PLANNED: Partial<Record<IconName, string>> = {
    clockAlert: 'P7 — đặt bàn quá giờ, phiếu chờ quá 15 phút',
    sort: 'P7 — sắp xếp ở đầu bảng 11 màn quản trị',
    filter: 'P7 — lọc ở rail lọc và hàng lọc',
    print: 'P7 — nút In hoá đơn ở màn thu ngân',
}
