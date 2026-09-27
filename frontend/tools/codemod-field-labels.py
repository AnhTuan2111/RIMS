"""
Gắn LỚP CHUẨN và NHÃN cho mọi ô nhập còn thiếu.

Hai lỗi cùng một gốc — ô nhập được viết tay, không qua bộ kit:

  1. Không có lớp rk-input / rk-select / rk-textarea → trình duyệt vẽ ô mặc
     định: cao 23–29px, viền 1px xám, lệch hẳn so với mọi ô khác. Năm màn bếp
     và ba hộp thoại tài khoản bị vậy.
  2. Không có nhãn → chỉ có placeholder. Trình đọc màn hình đọc ra "ô nhập"
     trống trơn, và placeholder biến mất ngay khi gõ chữ đầu tiên.

Ô đã nằm trong <label> hoặc <Field> thì có nhãn rồi — không thêm aria-label
đè lên, vì aria-label THẮNG nhãn nhìn thấy và hai cái sẽ lệch nhau.

Chạy lại được: ô đã có lớp / đã có nhãn thì bỏ qua.
"""
import glob
import re

# Nhãn cho ô chọn — đặt theo BIẾN mà ô đó gắn vào, vì option đầu tiên
# ("Tất cả bàn") là một giá trị chứ không phải tên của ô.
SELECT_LABELS = {
    'selectedCategory': 'Lọc theo danh mục',
    'selectedStatus': 'Lọc theo trạng thái',
    'tableFilter': 'Lọc theo bàn',
    'tableNumber': 'Lọc theo bàn',
    'selectedTable': 'Lọc theo bàn',
    'methodFilter': 'Lọc theo phương thức thanh toán',
    'paymentMethod': 'Lọc theo phương thức thanh toán',
    'sortOrder': 'Sắp xếp',
    'groupFilter': 'Lọc theo nhóm món',
    'form.role': 'Vai trò',
}

# Ô nhập không có placeholder dùng được làm nhãn.
VALUE_LABELS = {
    'formData.imageUrl': 'Đường dẫn ảnh món',
    'chefInternalNote': 'Ghi chú nội bộ gửi phục vụ',
    'cancelReason': 'Lý do huỷ món',
}

# Placeholder là VÍ DỤ chứ không phải tên ô — nhãn phải nói ô đó là gì.
PLACEHOLDER_LABELS = {
    'Nhập Số điện thoại khách hàng...': 'Số điện thoại khách hàng',
    'Tên khách hàng (*)': 'Tên khách hàng',
    'Email (*)': 'Email khách hàng',
    'Mã hóa đơn...': 'Tìm theo mã hoá đơn',
    'Dán URL hình ảnh đường dẫn công khai (https://...)': 'Đường dẫn ảnh món',
    'Nhập tóm tắt thông tin mô tả về nhóm món ăn này...': 'Mô tả danh mục',
}

CLASS_FOR = {'input': 'rk-input', 'select': 'rk-select', 'textarea': 'rk-textarea'}


def tag_end(s, i):
    """Vị trí dấu > đóng thẻ — bỏ qua > nằm trong {…} và trong chuỗi."""
    depth = 0
    quote = None
    while i < len(s):
        c = s[i]
        if quote:
            if c == quote:
                quote = None
        elif c in '"\'`' and depth == 0:
            quote = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
        elif c == '>' and depth == 0:
            return i
        i += 1
    return i


def wrapped_in_label(s, start):
    before = s[max(0, start - 3000):start]
    opens = [before.rfind('<label'), before.rfind('<Field ')]
    closes = [before.rfind('</label>'), before.rfind('</Field>')]
    return max(opens) > max(closes)


def label_for(kind, tag):
    if kind == 'select':
        m = re.search(r'value=\{([\w.]+)\}', tag)
        return SELECT_LABELS.get(m.group(1)) if m else None

    m = re.search(r'value=\{([\w.]+)\}', tag)
    if m and m.group(1) in VALUE_LABELS:
        return VALUE_LABELS[m.group(1)]

    m = re.search(r'placeholder="([^"]*)"', tag)
    if m:
        ph = m.group(1)
        if ph in PLACEHOLDER_LABELS:
            return PLACEHOLDER_LABELS[ph]
        if ph.startswith('Tìm'):
            return ph.rstrip('.… ')
    m = re.search(r"placeholder=\{'(Tìm[^']*)'", tag)
    if m:
        return 'Tìm theo tên món, bàn, mã đơn hoặc lý do huỷ'
    return None


changed_files = 0
report = []

for path in sorted(glob.glob('src/**/*.tsx', recursive=True)):
    s = open(path, encoding='utf-8').read()
    out = []
    pos = 0
    touched = False

    for m in re.finditer(r'<(input|select|textarea)\b', s):
        kind = m.group(1)
        end = tag_end(s, m.end())
        tag = s[m.start():end]

        if re.search(r'type="(checkbox|radio|hidden|file)"', tag):
            continue

        add = []

        if 'className' not in tag:
            add.append(f'className="{CLASS_FOR[kind]}"')

        labelled = (
            'aria-label' in tag
            or 'aria-labelledby' in tag
            or re.search(r'\bid=', tag)
            or wrapped_in_label(s, m.start())
        )

        if not labelled:
            name = label_for(kind, tag)
            if name:
                add.append(f'aria-label="{name}"')
            else:
                line = s[:m.start()].count('\n') + 1
                report.append(f'  CHƯA CÓ NHÃN (cần tay): {path}:{line} <{kind}>')

        if add:
            indent = re.search(r'\n([ \t]*)\S', tag)
            sep = '\n' + indent.group(1) if indent else ' '
            insert_at = m.end()
            out.append(s[pos:insert_at])
            out.append(''.join(sep + a for a in add))
            pos = insert_at
            touched = True

    if touched:
        out.append(s[pos:])
        open(path, 'w', encoding='utf-8', newline='\n').write(''.join(out))
        changed_files += 1
        report.append(f'sửa: {path}')

print('\n'.join(report))
print(f'{changed_files} tệp')
