"""Sửa tám nhóm giọng văn đã đếm trong code.

Chạy thử:  python3 tools/codemod-microcopy.py
Ghi thật:  python3 tools/codemod-microcopy.py --write

Chỉ đụng chuỗi hiển thị và comment. Đã soát: không định danh nào chứa
"hủy"/"xóa", nên thay thẳng là an toàn.
"""

import io
import os
import sys

# Thứ tự quan trọng: cụm dài thay trước cụm ngắn.
RULES = [
    # 7 · Bốn tên cho một phương thức QR -> khớp enum PaymentMethod.QRCODE
    ("'VNPay / QR Code'", "'Mã QR'"),
    ('>VNPay / QR<', '>Mã QR<'),
    ("'VNPay / QR'", "'Mã QR'"),
    ('>VNPay/QR<', '>Mã QR<'),
    ("'VNPay/QR'", "'Mã QR'"),
    ("'Thẻ / VNPay'", "'Mã QR'"),
    ("'Chuyển khoản/QR'", "'Mã QR'"),
    # 5 · "thành công!" chỉ còn ở màn kết quả thanh toán.
    #     Không bỏ phản hồi — đổi sang câu thuật lại việc đã làm.
    ("'Tạo tài khoản nhân viên thành công!'", "'Đã tạo tài khoản nhân viên'"),
    ("'Tạo tài khoản khách hàng thành công!'", "'Đã tạo tài khoản khách hàng'"),
    ("'Cập nhật tài khoản thành công!'", "'Đã cập nhật tài khoản'"),
    ('Đăng ký thành công!', 'Đã tạo tài khoản.'),
    ('Đặt bàn thành công!', 'Đã đặt bàn'),
    ('Hủy đặt bàn thành công!', 'Đã huỷ đặt bàn'),
    ('Hủy đặt bàn thành công', 'Đã huỷ đặt bàn'),
    ('Cập nhật hồ sơ thành công!', 'Đã cập nhật hồ sơ'),
    ('Đổi mật khẩu thành công!', 'Đã đổi mật khẩu'),
    ("'Cập nhật đơn hàng thành công!'", "'Đã cập nhật đơn'"),
    ('Đăng ký thành viên thành công', 'Đã đăng ký thành viên'),
    # 6 · Tiếng Việt không dùng Title Case
    ('Sửa Đặt Bàn', 'Sửa đặt bàn'),
    # 4 · Một từ cho một nghĩa
    ('Tình trạng', 'Trạng thái'),
    # 1 · Chính tả: huỷ
    ('hủy', 'huỷ'),
    ('Hủy', 'Huỷ'),
    ('HỦY', 'HUỶ'),
    # 2 · Chính tả: xoá
    ('xóa', 'xoá'),
    ('Xóa', 'Xoá'),
    ('XÓA', 'XOÁ'),
    # 3 · Dấu ba chấm: ba dấu chấm, không dùng ký tự ellipsis
    ('…', '...'),
]


def main():
    write = '--write' in sys.argv
    hits = {}
    files = 0

    for root, _dirs, names in os.walk('src'):
        for name in names:
            if not name.endswith(('.tsx', '.ts')):
                continue
            path = os.path.join(root, name)
            text = io.open(path, encoding='utf-8').read()
            original = text

            for old, new in RULES:
                count = text.count(old)
                if count:
                    hits[old] = hits.get(old, 0) + count
                    text = text.replace(old, new)

            if text != original:
                files += 1
                if write:
                    io.open(path, 'w', encoding='utf-8', newline='\n').write(text)

    print(('ĐÃ GHI' if write else 'CHẠY THỬ') + ' — %d file' % files)
    for old, count in sorted(hits.items(), key=lambda kv: -kv[1]):
        print('  %4d  %s' % (count, old.replace('\n', ' ')[:64]))


if __name__ == '__main__':
    main()
