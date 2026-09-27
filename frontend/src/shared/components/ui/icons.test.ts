import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join} from 'node:path'

import {describe, expect, it} from 'vitest'

import {ICONS, ICON_MEANING, ICON_PLANNED} from './icons'

/**
 * Canh bộ icon khỏi trôi.
 *
 * <p>Hệ "Phiếu bếp" chạy luật "một nghĩa một icon, một icon một nghĩa". Luật đó
 * không tự giữ được: thêm một icon mà quên ghi nghĩa thì sáu tháng sau không ai
 * biết nó khác `check` ở chỗ nào, và sẽ có người vẽ thêm cái thứ ba cùng nghĩa.
 *
 * <p>Hai cổng dưới đây bắt đúng hai kiểu trôi đó.
 */

const SRC = join(process.cwd(), 'src')

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry)

        if (statSync(full).isDirectory()) {
            return walk(full)
        }

        return full.endsWith('.tsx') || full.endsWith('.ts') ? [full] : []
    })
}

const sources = walk(SRC)
    .filter((file) => !file.endsWith('icons.ts') && !file.endsWith('icons.test.ts'))
    .map((file) => readFileSync(file, 'utf8'))

describe('Bộ icon', () => {
    it('mọi icon đều có nghĩa được ghi', () => {
        const missing = Object.keys(ICONS).filter((name) => !(name in ICON_MEANING))

        expect(missing, `thiếu nghĩa cho: ${missing.join(', ')}`).toEqual([])
    })

    it('không có nghĩa nào mồ côi, tức ghi nghĩa cho icon không tồn tại', () => {
        const orphans = Object.keys(ICON_MEANING).filter((name) => !(name in ICONS))

        expect(orphans, `nghĩa mồ côi: ${orphans.join(', ')}`).toEqual([])
    })

    it('không có hai icon nào mang cùng một nghĩa', () => {
        const seen = new Map<string, string>()
        const clashes: string[] = []

        for (const [name, meaning] of Object.entries(ICON_MEANING)) {
            const key = meaning.trim().toLowerCase()
            const first = seen.get(key)

            if (first) {
                clashes.push(`${first} và ${name} cùng nghĩa "${meaning}"`)
            } else {
                seen.set(key, name)
            }
        }

        expect(clashes, clashes.join(' · ')).toEqual([])
    })

    it('mọi icon khai trước đều ghi rõ pha sẽ dùng', () => {
        const stale = Object.keys(ICON_PLANNED).filter((name) =>
            sources.some((source) => source.includes(`"${name}"`)),
        )

        expect(
            stale,
            `đã dùng rồi, xoá khỏi ICON_PLANNED: ${stale.join(', ')}`,
        ).toEqual([])
    })

    it('không có icon nào không ai dùng', () => {
        // Bộ icon chưa được gắn vào màn nào thì chưa có gì để canh. Cổng này tự bật
        // khi màn đầu tiên dùng <Icon name="…" />, tức là lúc pha P4 bắt đầu.
        //
        // Dấu hiệu phải là `<Icon name=` chứ không phải `<Icon`: HomePage và
        // ThemeToggle đang đặt biến cục bộ tên Icon cho component của lucide, nên
        // `<Icon` một mình sẽ báo nhầm là đã dùng.
        const adopted = sources.some((source) => source.includes('<Icon name='))

        if (!adopted) {
            return
        }

        const unused = Object.keys(ICONS).filter(
            (name) =>
                !(name in ICON_PLANNED) &&
                !sources.some((source) => source.includes(`"${name}"`)),
        )

        expect(unused, `icon không ai dùng: ${unused.join(', ')}`).toEqual([])
    })
})
