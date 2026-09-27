"""Đổi 56 icon lucide sang bảng ICONS của hệ "Phiếu bếp".

Chạy thử:  python3 tools/codemod-icons.py
Ghi thật:  python3 tools/codemod-icons.py --write

Ánh xạ quyết theo luật "một nghĩa một icon": nhiều icon lucide cùng nghĩa thì gộp
về một (Soup/Utensils/UtensilsCrossed/ChefHat/Flame/BookOpen -> kitchen), và
những nhóm mà design.md nói KHÔNG vẽ icon thì bỏ hẳn phần tử.
"""

import io
import os
import re
import sys

MAP = {
    'X': 'x',
    'Check': 'check',
    'CheckCheck': 'check',
    'ArrowLeft': 'back',
    'ArrowRight': 'next',
    'ChevronLeft': 'prev',
    'ChevronRight': 'next',
    'Menu': 'menu',
    'Plus': 'plus',
    'Pencil': 'pen',
    'Trash2': 'trash',
    'User': 'user',
    'CircleUser': 'user',
    'Users': 'user',
    'Clock': 'clock',
    'CalendarDays': 'booking',
    'CalendarClock': 'booking',
    'Grid2x2': 'table',
    'LayoutGrid': 'chart',
    'ReceiptText': 'invoice',
    'FileText': 'invoice',
    'Wallet': 'invoice',
    'Soup': 'kitchen',
    'Utensils': 'kitchen',
    'UtensilsCrossed': 'kitchen',
    'ChefHat': 'kitchen',
    'Flame': 'kitchen',
    'BookOpen': 'kitchen',
    'FolderTree': 'kitchen',
    'FolderOpen': 'kitchen',
    'Store': 'gear',
    'ChartColumn': 'chart',
    'Ban': 'ban',
    'Layers': 'ticket',
    'Dot': 'rows',
    'AlertTriangle': 'alert',
    'TriangleAlert': 'alert',
    'Eye': 'eye',
    'EyeOff': 'eyeOff',
    'Download': 'download',
    'LogOut': 'logout',
    'KeyRound': 'key',
    'Bell': 'bell',
    'RotateCcw': 'refresh',
    'Sun': 'sun',
    'Moon': 'moon',
}

# Bỏ hẳn, theo design.md § Không vẽ icon cho:
#   ô thống kê (số kiểu bảng tỉ số đã đủ) · món ăn (đã có 43 ảnh thật) ·
#   phương thức trả (chip chữ rõ hơn) · thành tích (dùng số hạng) ·
#   trạng thái rỗng (dùng dải sọc chéo).
DROP = {
    'Inbox', 'Globe', 'Trophy', 'Crown', 'Coins', 'QrCode', 'TrendingUp',
    'PauseCircle', 'Sparkles', 'Image', 'MessageSquare', 'Info',
    'MapPin', 'Monitor', 'Phone',
}

IMPORT_RE = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'lucide-react'\s*\n", re.S)


def strip_attrs(attrs):
    """Bỏ aria-hidden: component Icon tự đặt. Giữ nguyên phần còn lại."""
    out = (attrs or ' ').replace('aria-hidden="true"', '').replace('aria-hidden', '')
    out = re.sub(r'\s+', ' ', out)
    return out if out.strip() else ' '


def main():
    write = '--write' in sys.argv
    changed = []
    leftover = []

    for root, _dirs, files in os.walk('src'):
        for name in files:
            if not name.endswith(('.tsx', '.ts')):
                continue
            path = os.path.join(root, name)
            text = io.open(path, encoding='utf-8').read()
            if "'lucide-react'" not in text:
                continue

            match = IMPORT_RE.search(text)
            if not match:
                continue

            imported = [n.strip() for n in match.group(1).split(',') if n.strip()]
            original = text

            # 1. Bỏ prop icon={<Name ... />} — ô thống kê không đeo icon.
            for n in DROP:
                text = re.sub(r'\n\s*icon=\{<' + n + r'\s[^>]*/>\}', '', text)
                text = re.sub(r'\n\s*icon=\{<' + n + r'\s*/>\}', '', text)

            # 2. Bỏ phần tử đứng một mình.
            for n in DROP:
                text = re.sub(r'<' + n + r'\s[^>]*/>\s*', '', text)
                text = re.sub(r'<' + n + r'\s*/>\s*', '', text)

            # 3. Đổi sang <Icon name="..." />.
            for n in imported:
                if n in DROP or n not in MAP:
                    continue
                target = MAP[n]

                def swap(m, t=target):
                    return '<Icon name="%s"%s/>' % (t, strip_attrs(m.group(1)))

                text = re.sub(r'<' + n + r'(\s[^>]*?)?/>', swap, text)

            # 4. Thay dòng import.
            text = (
                text[: match.start()]
                + "import {Icon} from '@/shared/components/ui/Icon'\n"
                + text[match.end():]
            )

            body = IMPORT_RE.sub('', text)
            rest = sorted({n for n in imported if re.search(r'\b' + n + r'\b', body)})
            if rest:
                leftover.append((path, rest))

            if text != original:
                changed.append(path)
                if write:
                    io.open(path, 'w', encoding='utf-8', newline='\n').write(text)

    print(('ĐÃ GHI' if write else 'CHẠY THỬ') + ' — %d file' % len(changed))
    if leftover:
        print('\nCÒN SÓT %d file, phải sửa tay:' % len(leftover))
        for path, rest in leftover:
            print('  %-56s %s' % (path.replace(os.sep, '/'), ' '.join(rest)))


if __name__ == '__main__':
    main()
