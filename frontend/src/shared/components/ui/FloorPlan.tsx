import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react'

import {Icon} from './Icon'

/**
 * Thứ tối thiểu một bàn phải có để đứng được trên sơ đồ.
 *
 * <p>Cố ý KHÔNG nhận nguyên DTO của bàn: màn Phục vụ dùng TableDetailResponse,
 * màn Quản trị dùng AdminTableResponse, và hai cái khác nhau. Sơ đồ chỉ cần
 * biết bàn nằm ở đâu, to bằng nào, thuộc khu nào.
 */
export type FloorItem = {
    tableId: number
    layoutX?: number | null
    layoutY?: number | null
    layoutW?: number | null
    layoutH?: number | null
    zone?: string | null
}

type FloorPlanProps<T extends FloorItem> = {
    tables: T[]
    /** Vẽ ruột một ô bàn. Sơ đồ chỉ lo chỗ đứng, không lo nội dung. */
    renderTable: (table: T) => ReactNode
    /** Nhãn cho trình đọc màn hình. */
    label: string
    /** Thêm vào mỗi ô — dùng cho tay cầm kéo thả ở màn Quản trị. */
    tableProps?: (table: T) => Record<string, unknown>
    /** Khối phủ lên toàn mặt bằng, ví dụ lưới chấm lúc đang vẽ. */
    overlay?: ReactNode
    /**
     * Số cột tối thiểu mỗi khu. Màn Quản trị cần chỗ trống để kéo bàn sang;
     * màn Phục vụ thì không — lưới rộng đúng bằng phần có bàn.
     */
    minCols?: number
}

/** Bàn chưa đặt chỗ thì to bằng ô này. */
const DEFAULT_W = 3
const DEFAULT_H = 2

/** Giới hạn thu phóng. 100% là một ô lưới bằng 2.5rem. */
const CELL_REM = 2.5
const GRID_GAP_PX = 2
const ZOOM_MIN = 50
const ZOOM_MAX = 160
/** Dưới mức này thì các khu xếp CHỒNG thay vì đứng cạnh nhau. */
const SIDE_BY_SIDE_MIN = 90
const ZOOM_STEP = 15

/**
 * Sơ đồ mặt bằng — bàn đứng đúng chỗ của nó trong quán.
 *
 * <p>Vì sao không dùng lưới thẻ như cũ: phục vụ nhìn sơ đồ để tìm một cái bàn
 * NGOÀI ĐỜI. Một lưới xếp bàn theo số thứ tự không giúp được việc đó — bàn 7
 * cạnh bàn 8 trên màn hình nhưng có thể ở hai đầu quán.
 *
 * <p>Toạ độ tính bằng Ô LƯỚI chứ không phải pixel, nên cùng một mặt bằng giữ
 * đúng hình dạng ở mọi cỡ màn: đổi cỡ ô là cả sơ đồ nở ra hay co lại nguyên
 * hình, không bị méo.
 *
 * <p>Bàn CHƯA có chỗ xếp thành một hàng riêng ở cuối, có tiêu đề nói rõ. Dồn
 * chúng vào góc (0,0) thì mười hai bàn chồng lên nhau, và quản lý sẽ tưởng sơ
 * đồ hỏng chứ không hiểu là mình chưa vẽ.
 */
export function FloorPlan<T extends FloorItem>({
    tables,
    renderTable,
    label,
    tableProps,
    overlay,
    minCols = 0,
}: FloorPlanProps<T>) {
    const [zoom, setZoom] = useState(100)

    /**
     * Người dùng đã tự thu phóng chưa. Chưa thì sơ đồ TỰ VỪA KHUNG mỗi lần
     * khung đổi cỡ; rồi thì thôi — tự chỉnh đè lên lựa chọn của người dùng là
     * giật mất thứ họ vừa chọn.
     */
    const [manual, setManual] = useState(false)
    const viewRef = useRef<HTMLDivElement>(null)

    const {zones, loose, cols} = useMemo(() => {
        const placed = tables.filter((t) => t.layoutX != null && t.layoutY != null)
        const rest = tables.filter((t) => t.layoutX == null || t.layoutY == null)

        // Khu vực giữ thứ tự xuất hiện, không sắp theo bảng chữ cái: "Tầng 1"
        // phải đứng trước "Tầng 2", mà sắp chữ thì "Sân vườn" chen vào giữa.
        const byZone = new Map<string, T[]>()

        for (const table of placed) {
            const key = table.zone?.trim() || ''
            const bucket = byZone.get(key)
            if (bucket) {
                bucket.push(table)
            } else {
                byZone.set(key, [table])
            }
        }

        // Bề ngang TỪNG KHU = ô xa nhất về bên phải của khu đó. Bản trước dùng
        // một bề ngang chung tối thiểu 12 ô cho mọi khu, và thu phóng chỉ được
        // thu nhỏ: ở 1440px bàn dồn một góc trái, còn lại là mảng trống lớn.
        const entries = [...byZone.entries()].map(([zone, items]) => {
            const width = items.reduce(
                (max, t) => Math.max(max, (t.layoutX ?? 0) + (t.layoutW ?? DEFAULT_W)),
                Math.max(1, minCols),
            )
            return {zone, items, cols: width}
        })

        return {
            zones: entries,
            loose: rest,
            cols: entries.map((entry) => entry.cols),
        }
    }, [tables, minCols])

    /**
     * Tự vừa khung. Sơ đồ là để thấy CẢ QUÁN một lượt: ở 100% trên điện thoại
     * thì chỉ thấy được nửa bên trái, và không có gì nói rằng bên phải còn bàn
     * — người phục vụ thấy B05 rồi B07 và tưởng quán không có B06.
     *
     * <p>Chỉ THU NHỎ, không bao giờ phóng quá 100%: trên màn rộng mà sơ đồ tự
     * phình ra thì một quán mười bàn chiếm cả màn hình như một tấm áp phích.
     */
    useEffect(() => {
        const view = viewRef.current

        if (!view || manual) {
            return
        }

        const fit = () => {
            if (cols.length === 0) {
                return
            }

            const cs = getComputedStyle(view)
            const room =
                view.clientWidth -
                parseFloat(cs.paddingLeft) -
                parseFloat(cs.paddingRight)
            const zoneGap = parseFloat(cs.columnGap) || 0
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)

            // Thu phóng để ĐẶT VỪA một số cột trong bề ngang còn lại.
            const zoomFor = (totalCols: number, zoneCount: number) => {
                const gaps =
                    (totalCols - zoneCount) * GRID_GAP_PX + (zoneCount - 1) * zoneGap
                const cell = (room - gaps) / totalCols
                return Math.floor((cell / (CELL_REM * rem)) * 100)
            }

            // Ưu tiên các khu ĐỨNG CẠNH NHAU — mặt bằng lấp đầy bề ngang thay
            // vì chồng lên nhau và để trống nửa màn. Quá chật thì xếp chồng.
            const side = zoomFor(
                cols.reduce((sum, c) => sum + c, 0),
                cols.length,
            )
            const wanted = side >= SIDE_BY_SIDE_MIN ? side : zoomFor(Math.max(...cols), 1)

            setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, wanted)))
        }

        fit()

        const observer = new ResizeObserver(fit)
        observer.observe(view)

        return () => observer.disconnect()
    }, [cols, manual])

    const zoomBy = (step: number) => {
        setManual(true)
        setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + step)))
    }

    const style = {
        '--rims-floor-cell': `${(zoom / 100) * CELL_REM}rem`,
    } as React.CSSProperties

    return (
        <div className="rk-floor" aria-label={label}>
            <div className="rk-floor__bar">
                <span className="rk-floor__zoomlabel">Thu phóng</span>

                <button
                    type="button"
                    className="rk-iconbtn"
                    aria-label="Thu nhỏ sơ đồ"
                    disabled={zoom <= ZOOM_MIN}
                    onClick={() => zoomBy(-ZOOM_STEP)}
                >
                    <Icon name="zoomOut" className="rk-icon" />
                </button>

                <span className="rk-floor__zoom">{zoom}%</span>

                <button
                    type="button"
                    className="rk-iconbtn"
                    aria-label="Phóng to sơ đồ"
                    disabled={zoom >= ZOOM_MAX}
                    onClick={() => zoomBy(ZOOM_STEP)}
                >
                    <Icon name="zoomIn" className="rk-icon" />
                </button>
            </div>

            {/* Khung cuộn mang touch-action: pinch-zoom để hai ngón phóng to
                được trên màn cảm ứng. Nút bấm vẫn phải có: chúng là cách duy
                nhất dùng được bằng chuột và bàn phím. */}
            <div className="rk-floor__view" style={style} ref={viewRef}>
                {zones.map(({zone, items, cols: zoneCols}) => (
                    <section className="rk-floor__zone" key={zone || '_'}>
                        {zone && <h3 className="rk-floor__zonename">{zone}</h3>}

                        <div
                            className="rk-floor__grid"
                            style={{'--rims-floor-cols': zoneCols} as React.CSSProperties}
                        >
                            {overlay}

                            {items.map((table) => (
                                <div
                                    key={table.tableId}
                                    className="rk-floor__slot"
                                    style={{
                                        gridColumn: `${(table.layoutX ?? 0) + 1} / span ${table.layoutW ?? DEFAULT_W}`,
                                        gridRow: `${(table.layoutY ?? 0) + 1} / span ${table.layoutH ?? DEFAULT_H}`,
                                    }}
                                    {...(tableProps?.(table) ?? {})}
                                >
                                    {renderTable(table)}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {loose.length > 0 && (
                    <section className="rk-floor__zone rk-floor__zone--loose">
                        <h3 className="rk-floor__zonename">Chưa xếp vào mặt bằng</h3>

                        <div className="rk-floor__loose">
                            {loose.map((table) => (
                                <div
                                    key={table.tableId}
                                    className="rk-floor__slot"
                                    {...(tableProps?.(table) ?? {})}
                                >
                                    {renderTable(table)}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
