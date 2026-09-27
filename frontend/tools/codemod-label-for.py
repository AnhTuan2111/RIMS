"""Gắn nhãn với ô nhập: thêm htmlFor/id cho mọi cặp còn rời nhau.

Chạy thử:  python3 tools/codemod-label-for.py
Ghi thật:  python3 tools/codemod-label-for.py --write

VÌ SAO CẦN: `<label>` không có `htmlFor` và không bọc ô nhập thì nó chỉ là một
đoạn chữ nằm cạnh. Bấm vào nhãn không nhảy vào ô — vùng bấm mất đi phần lớn
diện tích, và trên màn cảm ứng đó là khác biệt thật. Trình đọc màn hình thì
đọc ô nhập ra "edit text", không kèm tên trường.

CÁCH LÀM: chỉ đụng đúng một khuôn — một `<label className="rk-field__label">`
có chữ, rồi tới thẻ nhập ĐẦU TIÊN sau nó. Id sinh từ tên file cộng chữ trong
nhãn, bỏ dấu, nên nó ổn định giữa các lần chạy và không đụng nhau.
"""

import io
import os
import re
import sys
import unicodedata

# Nhãn có thể chứa một thẻ con — thường là dấu sao bắt buộc:
#     <label ...>Tên khách <span className="rk-field__required">*</span></label>
# Phần CHỮ dùng để sinh id lấy từ đoạn text đầu tiên.
LABEL = re.compile(
    r'<label className="rk-field__label">\s*([^<>{}]*?)\s*'
    r'(?:<span className="rk-field__required">\*</span>\s*)?</label>',
    re.S,
)

# Thẻ nhập ngay sau nhãn. Không dùng .*? qua nhiều thẻ: chỉ nhận nếu thẻ nhập
# là thứ kế tiếp, để không gắn nhầm nhãn này vào ô của trường khác.
FIELD = re.compile(r'\s*<(input|select|textarea)\b')


def slug(text):
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = text.replace('đ', 'd').replace('Đ', 'D')
    text = re.sub(r'[^A-Za-z0-9]+', '-', text).strip('-').lower()
    return text or 'truong'


def main():
    write = '--write' in sys.argv
    total = 0
    touched = 0

    for root, _dirs, names in os.walk('src'):
        for name in names:
            if not name.endswith('.tsx'):
                continue

            path = os.path.join(root, name)
            text = io.open(path, encoding='utf-8').read()
            base = slug(os.path.splitext(name)[0])

            out = []
            cursor = 0
            hits = 0
            seen = {}

            for m in LABEL.finditer(text):
                after = FIELD.match(text, m.end())

                if not after:
                    continue

                label_text = m.group(1)

                # Nhãn rỗng sau khi bóc thẻ con thì không sinh được id có
                # nghĩa — bỏ qua, để người viết tự đặt.
                if not label_text.strip():
                    continue

                key = slug(label_text)

                # Cùng một tên nhãn xuất hiện nhiều lần trong một file thì
                # đánh số, vì id phải duy nhất trong cả trang.
                seen[key] = seen.get(key, 0) + 1
                ident = f'{base}-{key}' + ('' if seen[key] == 1 else f'-{seen[key]}')

                out.append(text[cursor:m.start()])
                # Giữ NGUYÊN ruột nhãn, chỉ thêm thuộc tính: ruột có thể
                # chứa dấu sao bắt buộc, và viết lại nó là làm mất dấu đó.
                body = text[m.start() : m.end()]
                body = body.replace(
                    '<label className="rk-field__label">',
                    f'<label className="rk-field__label" htmlFor="{ident}">',
                    1,
                )
                out.append(body)

                # Chèn id vào ngay sau tên thẻ nhập.
                tag_start = after.start()
                tag_name_end = after.end()
                out.append(text[m.end():tag_name_end])
                out.append(f' id="{ident}"')
                cursor = tag_name_end
                hits += 1

            if hits:
                out.append(text[cursor:])
                new_text = ''.join(out)
                total += hits
                touched += 1

                if write:
                    io.open(path, 'w', encoding='utf-8', newline='\n').write(new_text)

                print(f'  {hits:3d}  {path}')

    print(('ĐÃ GHI' if write else 'CHẠY THỬ') + f' — {total} cặp nhãn/ô ở {touched} file')


if __name__ == '__main__':
    main()
