import {useCallback, useEffect, useState} from 'react'

import * as adminApi from '@/shared/api/admin'
import type {AdminTable, TableSlot} from '@/shared/api/admin'
import {ErrorState, LoadingState} from '@/shared/components/feedback'
import {FloorPlan, PageCard, PageHeader} from '@/shared/components/ui'
import {Icon} from '@/shared/components/ui/Icon'
import {useToast} from '@/app/providers/useToast'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

/** Bàn mới kéo vào mặt bằng to bằng ô này. */
const NEW_W = 3
const NEW_H = 2

/** Khổ lưới lúc đang vẽ — rộng hơn mặt bằng thật để còn chỗ thả bàn. */
const GRID_COLS = 20
const GRID_ROWS = 14

type Draft = Record<number, {x: number; y: number; w: number; h: number; zone: string}>

/**
 * Màn thứ 37 — Quản trị vẽ mặt bằng quán.
 *
 * <p>Sơ đồ bàn của Phục vụ và Thu ngân chỉ có ích khi nó giống cái quán thật.
 * Trước đây không có chỗ nào nhập hình dạng đó, nên cả hai màn đành xếp bàn
 * theo số thứ tự — thứ không giúp gì cho việc tìm một cái bàn ngoài đời.
 *
 * <p>Kéo thả TỰ VIẾT, không cài thư viện: dự án đã chốt là motion-cut, và một
 * thư viện kéo thả kéo theo cả hệ thống hoạt ảnh của nó. Dùng Pointer Events
 * nên chuột, bút và ngón tay đi chung một đường mã.
 *
 * <p>Bàn nào cũng đặt được bằng BÀN PHÍM: chọn bàn rồi dùng phím mũi tên. Kéo
 * thả không dùng được bằng bàn phím, và một màn chỉ kéo thả được là một màn
 * khoá cửa với người không dùng chuột.
 */
export default function AdminFloorPlanPage() {
    const {notify} = useToast()

    const [tables, setTables] = useState<AdminTable[]>([])
    const [draft, setDraft] = useState<Draft>({})
    const [selected, setSelected] = useState<number | null>(null)
    const [dragging, setDragging] = useState<number | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    // KHÔNG bật cờ tải ở đầu hàm: useState đã khởi tạo là true, và đặt state
    // ngay trong thân effect là thứ react-hooks bắt lỗi — đúng, vì nó là một
    // lần vẽ lại thừa. Nút Thử lại tự bật cờ trước khi gọi.
    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const {data} = await adminApi.getAllTables(signal)

            if (signal?.aborted) {
                return
            }

            // Chỉ bàn còn trong sơ đồ. Bàn đã cất đi không thuộc mặt bằng nữa,
            // và để chúng ở đây thì quản lý sẽ xếp chỗ cho những cái bàn mà
            // Phục vụ không bao giờ nhìn thấy.
            const live = data.filter((table) => table.active)

            setTables(live)
            setDraft(
                Object.fromEntries(
                    live
                        .filter((table) => table.layoutX != null && table.layoutY != null)
                        .map((table) => [
                            table.id,
                            {
                                x: table.layoutX ?? 0,
                                y: table.layoutY ?? 0,
                                w: table.layoutW ?? NEW_W,
                                h: table.layoutH ?? NEW_H,
                                zone: table.zone ?? '',
                            },
                        ]),
                ),
            )
            setDirty(false)
            setError(null)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[ADMIN_FLOOR_LOAD_ERROR]', requestError)
            setError('Không tải được danh sách bàn.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loading khởi tạo là true
        void load(controller.signal)
        return () => controller.abort()
    }, [load])

    /** Đổi chỗ một bàn, giữ nó trong khổ lưới. */
    function place(tableId: number, x: number, y: number) {
        setDraft((current) => {
            const slot = current[tableId] ?? {x: 0, y: 0, w: NEW_W, h: NEW_H, zone: ''}

            return {
                ...current,
                [tableId]: {
                    ...slot,
                    x: Math.max(0, Math.min(GRID_COLS - slot.w, x)),
                    y: Math.max(0, Math.min(GRID_ROWS - slot.h, y)),
                },
            }
        })
        setDirty(true)
    }

    function handlePointerDown(tableId: number, event: React.PointerEvent) {
        // Chỉ nút chính. Chuột phải là để mở menu ngữ cảnh, không phải để kéo.
        if (event.button !== 0) {
            return
        }

        // Tìm lưới bằng closest() từ chính nút đang kéo, không giữ một ref
        // riêng: bàn CHƯA xếp nằm ở hàng cuối chứ không nằm trên lưới, nên một
        // ref duy nhất sẽ trỏ nhầm ngay lần kéo đầu tiên.
        const grid = (event.target as HTMLElement).closest('.rk-floor__grid')

        if (!grid) {
            // Bàn chưa xếp: bấm là đưa nó vào mặt bằng ở góc trên trái, rồi
            // kéo tiếp từ đó. Không thả trực tiếp từ hàng "chưa xếp" vào lưới
            // được, vì hai khối đó không chung hệ toạ độ.
            setSelected(tableId)
            place(tableId, 0, 0)
            return
        }

        event.currentTarget.setPointerCapture(event.pointerId)
        setSelected(tableId)
        setDragging(tableId)

        const box = grid.getBoundingClientRect()

        // Cỡ ô đọc TỪ DOM chứ không gõ cứng: người dùng có thể đã thu phóng,
        // và một hằng số 40px sẽ làm bàn nhảy sai chỗ ngay khi zoom khác 100%.
        const cell = box.width / GRID_COLS

        const move = (pointer: PointerEvent) => {
            place(
                tableId,
                Math.round((pointer.clientX - box.left) / cell - 1),
                Math.round((pointer.clientY - box.top) / cell - 1),
            )
        }

        const end = () => {
            setDragging(null)
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', end)
            window.removeEventListener('pointercancel', end)
        }

        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', end)
        window.addEventListener('pointercancel', end)
    }

    function handleKeyDown(tableId: number, event: React.KeyboardEvent) {
        const step: Record<string, [number, number]> = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
        }

        const delta = step[event.key]

        if (!delta) {
            return
        }

        event.preventDefault()

        const slot = draft[tableId]

        if (!slot) {
            // Bàn chưa xếp: phím mũi tên đưa nó vào mặt bằng ở góc trên trái.
            place(tableId, 0, 0)
            return
        }

        place(tableId, slot.x + delta[0], slot.y + delta[1])
    }

    function resize(tableId: number, dw: number, dh: number) {
        setDraft((current) => {
            const slot = current[tableId]

            if (!slot) {
                return current
            }

            return {
                ...current,
                [tableId]: {
                    ...slot,
                    w: Math.max(1, Math.min(20, slot.w + dw)),
                    h: Math.max(1, Math.min(20, slot.h + dh)),
                },
            }
        })
        setDirty(true)
    }

    function setZone(tableId: number, zone: string) {
        setDraft((current) => {
            const slot = current[tableId]

            if (!slot) {
                return current
            }

            return {...current, [tableId]: {...slot, zone}}
        })
        setDirty(true)
    }

    function removeFromPlan(tableId: number) {
        setDraft((current) => {
            const next = {...current}
            delete next[tableId]
            return next
        })
        setDirty(true)
    }

    async function save() {
        setSaving(true)

        try {
            const slots: TableSlot[] = Object.entries(draft).map(([tableId, slot]) => ({
                tableId: Number(tableId),
                x: slot.x,
                y: slot.y,
                w: slot.w,
                h: slot.h,
                zone: slot.zone.trim() || null,
            }))

            // Sơ đồ rỗng vẫn phải lưu được — đó là cách xoá cả mặt bằng. Backend
            // từ chối danh sách rỗng, nên gửi một mục giả sẽ là nói dối; thay
            // vào đó chặn ở đây và nói rõ.
            if (slots.length === 0) {
                notify('Chưa xếp bàn nào vào mặt bằng.', {tone: 'alert'})
                return
            }

            const {data} = await adminApi.saveTableLayout(slots)

            setTables(data.filter((table) => table.active))
            setDirty(false)
            notify('Đã lưu mặt bằng')
        } catch (requestError: unknown) {
            console.error('[ADMIN_FLOOR_SAVE_ERROR]', requestError)
            notify(getErrorMessage(requestError) || 'Không lưu được mặt bằng.', {
                tone: 'alert',
            })
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải danh sách bàn..."
                description="Hệ thống đang lấy mặt bằng hiện tại."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    setIsLoading(true)
                    void load()
                }}
            />
        )
    }

    // Trộn bản nháp vào danh sách bàn để FloorPlan vẽ theo chỗ ĐANG kéo, chứ
    // không theo chỗ đã lưu trên máy chủ.
    const view = tables.map((table) => {
        const slot = draft[table.id]

        return {
            ...table,
            tableId: table.id,
            layoutX: slot?.x ?? null,
            layoutY: slot?.y ?? null,
            layoutW: slot?.w ?? null,
            layoutH: slot?.h ?? null,
            zone: slot?.zone || null,
        }
    })

    const current = selected == null ? null : draft[selected]
    const currentTable = tables.find((table) => table.id === selected)

    return (
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    title="Mặt bằng quán"
                    description="Kéo bàn vào đúng chỗ của nó trong quán. Phục vụ và Thu ngân sẽ nhìn thấy đúng sơ đồ này."
                    actions={
                        <button
                            type="button"
                            className="rk-btn rk-btn--go"
                            disabled={saving || !dirty}
                            onClick={() => void save()}
                        >
                            <Icon name="save" className="rk-icon" />
                            {saving ? 'Đang lưu...' : 'Lưu mặt bằng'}
                        </button>
                    }
                />
            </PageCard>

            <div className={current ? 'rk-two rk-two--wideleft' : 'rk-stack'}>
                <PageCard>
                    <FloorPlan
                        label="Mặt bằng đang vẽ"
                        tables={view}
                        overlay={<div className="rk-floor__dots" aria-hidden="true" />}
                        tableProps={(table) => ({
                            className: `rk-floor__slot${
                                dragging === table.tableId ? ' is-dragging' : ''
                            }${selected === table.tableId ? ' is-selected' : ''}`,
                        })}
                        renderTable={(table) => (
                            <button
                                type="button"
                                className="rk-planbtn"
                                aria-label={`Bàn ${table.tableNumber}, kéo để đổi chỗ`}
                                aria-pressed={selected === table.tableId}
                                onPointerDown={(event) =>
                                    handlePointerDown(table.tableId, event)
                                }
                                onKeyDown={(event) => handleKeyDown(table.tableId, event)}
                                onClick={() => setSelected(table.tableId)}
                            >
                                <span className="rk-planbtn__no">
                                    {table.tableNumber}
                                </span>
                                <span className="rk-planbtn__seats">
                                    {table.capacity} chỗ
                                </span>
                            </button>
                        )}
                    />
                </PageCard>

                {current && currentTable && (
                    <aside className="rk-card rk-card--pad" aria-label="Bàn đang chọn">
                        <h2 className="rk-sectiontitle">
                            Bàn {currentTable.tableNumber}
                        </h2>

                        <dl className="rk-details">
                            <div>
                                <dt>Chỗ ngồi</dt>
                                <dd>{currentTable.capacity}</dd>
                            </div>
                            <div>
                                <dt>Vị trí</dt>
                                <dd className="rk-num">
                                    {current.x}, {current.y}
                                </dd>
                            </div>
                        </dl>

                        <div className="rk-field">
                            <label className="rk-field__label" htmlFor="floor-zone">
                                Khu vực
                            </label>

                            <input
                                id="floor-zone"
                                className="rk-input"
                                placeholder="Tầng 1, Sân vườn..."
                                value={current.zone}
                                onChange={(event) =>
                                    setZone(currentTable.id, event.target.value)
                                }
                            />
                        </div>

                        <div className="rk-field">
                            <span className="rk-field__label">Khổ bàn</span>

                            <div className="rk-actions">
                                <div className="rk-stepper">
                                    <button
                                        type="button"
                                        className="rk-stepper__btn"
                                        aria-label="Thu hẹp bàn"
                                        onClick={() => resize(currentTable.id, -1, 0)}
                                    >
                                        −
                                    </button>
                                    <span className="rk-stepper__value">{current.w}</span>
                                    <button
                                        type="button"
                                        className="rk-stepper__btn"
                                        aria-label="Nới rộng bàn"
                                        onClick={() => resize(currentTable.id, 1, 0)}
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="rk-stepper">
                                    <button
                                        type="button"
                                        className="rk-stepper__btn"
                                        aria-label="Giảm chiều cao bàn"
                                        onClick={() => resize(currentTable.id, 0, -1)}
                                    >
                                        −
                                    </button>
                                    <span className="rk-stepper__value">{current.h}</span>
                                    <button
                                        type="button"
                                        className="rk-stepper__btn"
                                        aria-label="Tăng chiều cao bàn"
                                        onClick={() => resize(currentTable.id, 0, 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="rk-btn rk-btn--danger"
                            onClick={() => {
                                removeFromPlan(currentTable.id)
                                setSelected(null)
                            }}
                        >
                            <Icon name="ban" className="rk-icon" />
                            Bỏ khỏi mặt bằng
                        </button>
                    </aside>
                )}
            </div>
        </div>
    )
}
