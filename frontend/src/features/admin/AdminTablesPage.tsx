import {useCallback, useEffect, useMemo, useState} from 'react'
import type {FormEvent} from 'react'
import {EyeOff, Grid2x2, Pencil, Plus, RotateCcw, Trash2} from 'lucide-react'

import {useToast} from '@/app/providers/useToast'
import * as adminApi from '@/shared/api/admin'
import type {AdminTable, TableStatus} from '@/shared/api/admin'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {
    ConfirmDialog,
    Modal,
    PageCard,
    PageHeader,
    Pagination,
} from '@/shared/components/ui'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

const ITEMS_PER_PAGE = 8

type UsageFilter = 'ALL' | 'ACTIVE' | 'PARKED'

const STATUS_LABEL: Record<TableStatus, string> = {
    AVAILABLE: 'Bàn trống',
    RESERVED: 'Đã đặt trước',
    SERVING: 'Đang phục vụ',
}

/** Chip trạng thái của bộ kit: màu đi kèm chấm dẫn và nhãn chữ. */
const STATUS_CHIP: Record<TableStatus, string> = {
    AVAILABLE: 'rk-chip rk-chip--ok',
    RESERVED: 'rk-chip rk-chip--brand',
    SERVING: 'rk-chip rk-chip--busy',
}

interface FormState {
    tableNumber: string
    capacity: string
}

const EMPTY_FORM: FormState = {tableNumber: '', capacity: '4'}

/**
 * Gợi ý số bàn kế tiếp theo đúng lối đặt tên đang dùng.
 *
 * <p>Đọc các số bàn hiện có dạng chữ-rồi-số (T01, B7, Bàn 12) và cộng thêm 1
 * vào số lớn nhất, giữ nguyên tiền tố và số chữ số. Nhà hàng đặt tên kiểu gì
 * thì hệ thống theo kiểu đó, không ép về "T%02d".
 */
function suggestNextTableNumber(tables: AdminTable[]): string {
    const parsed = tables
        .map((table) => /^(.*?)(\d+)$/.exec(table.tableNumber))
        .filter((match): match is RegExpExecArray => match !== null)

    if (parsed.length === 0) {
        return ''
    }

    const last = parsed.reduce((best, match) =>
        Number(match[2]) > Number(best[2]) ? match : best,
    )

    const prefix = last[1]
    const width = last[2].length

    return prefix + String(Number(last[2]) + 1).padStart(width, '0')
}

/**
 * Lý do không được cất hay bỏ bàn lúc này, hoặc null nếu bàn đang rảnh.
 *
 * <p>Máy chủ vẫn chặn, nhưng giao diện không nên mời người dùng bấm một nút
 * mà nó đã biết chắc sẽ bị từ chối.
 */
function busyReason(table: AdminTable): string | null {
    if (table.status === 'SERVING') {
        return 'Bàn đang phục vụ khách — thanh toán xong rồi làm lại.'
    }

    if (table.status === 'RESERVED') {
        return 'Bàn đã có người đặt — huỷ hoặc chuyển lần đặt đó trước.'
    }

    return null
}

export default function AdminTablesPage() {
    const {notify} = useToast()

    const [tables, setTables] = useState<AdminTable[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [usageFilter, setUsageFilter] = useState<UsageFilter>('ALL')
    const [page, setPage] = useState(1)

    const [editing, setEditing] = useState<AdminTable | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [removeTarget, setRemoveTarget] = useState<AdminTable | null>(null)

    const loadTables = useCallback(async (signal?: AbortSignal) => {
        try {
            const res = await adminApi.getAllTables(signal)
            setTables(res.data)
            setError(null)
        } catch (err: unknown) {
            if (isRequestCanceled(err)) return
            setError(getErrorMessage(err, 'Không tải được danh sách bàn.'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loading khởi tạo là true
        void loadTables(controller.signal)
        return () => controller.abort()
    }, [loadTables])

    const stats = useMemo(() => {
        const active = tables.filter((table) => table.active)
        return {
            active: active.length,
            parked: tables.length - active.length,
            seats: active.reduce((sum, table) => sum + table.capacity, 0),
        }
    }, [tables])

    const visibleTables = useMemo(() => {
        if (usageFilter === 'ACTIVE') return tables.filter((table) => table.active)
        if (usageFilter === 'PARKED') return tables.filter((table) => !table.active)
        return tables
    }, [tables, usageFilter])

    const totalPages = Math.max(1, Math.ceil(visibleTables.length / ITEMS_PER_PAGE))
    const safePage = Math.min(page, totalPages)
    const pageRows = visibleTables.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE,
    )

    const openCreate = () => {
        setEditing(null)
        setForm({tableNumber: suggestNextTableNumber(tables), capacity: '4'})
        setFormError(null)
        setFormOpen(true)
    }

    const openEdit = (table: AdminTable) => {
        setEditing(table)
        setForm({tableNumber: table.tableNumber, capacity: String(table.capacity)})
        setFormError(null)
        setFormOpen(true)
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        if (submitting) return

        const tableNumber = form.tableNumber.trim()
        const capacity = Number(form.capacity)

        if (!tableNumber) {
            setFormError('Nhập số bàn đã.')
            return
        }

        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
            setFormError('Số chỗ ngồi phải là số nguyên từ 1 đến 100.')
            return
        }

        setSubmitting(true)
        setFormError(null)

        try {
            if (editing) {
                await adminApi.updateTable(editing.id, {
                    tableNumber,
                    capacity,
                    // Sửa thông tin không đụng tới việc bàn đang dùng hay đã cất;
                    // bật/tắt là nút riêng trong bảng.
                    active: editing.active,
                })
                notify(`Đã cập nhật bàn “${tableNumber}”.`)
            } else {
                await adminApi.createTable({tableNumber, capacity})
                notify(`Đã thêm bàn “${tableNumber}”.`)
            }

            setFormOpen(false)
            await loadTables()
        } catch (err: unknown) {
            setFormError(getErrorMessage(err, 'Không lưu được bàn.'))
        } finally {
            setSubmitting(false)
        }
    }

    const toggleActive = async (table: AdminTable) => {
        try {
            await adminApi.updateTable(table.id, {
                tableNumber: table.tableNumber,
                capacity: table.capacity,
                active: !table.active,
            })
            notify(
                table.active
                    ? `Đã cất bàn “${table.tableNumber}” khỏi sơ đồ.`
                    : `Bàn “${table.tableNumber}” đã trở lại sơ đồ.`,
            )
            await loadTables()
        } catch (err: unknown) {
            notify(getErrorMessage(err, 'Không đổi được trạng thái bàn.'), {
                tone: 'alert',
            })
        }
    }

    const confirmRemove = async () => {
        if (!removeTarget || submitting) return

        setSubmitting(true)

        try {
            const res = await adminApi.deleteTable(removeTarget.id)
            notify(res.data.message)
            setRemoveTarget(null)
            await loadTables()
        } catch (err: unknown) {
            notify(getErrorMessage(err, 'Không bỏ được bàn này.'), {tone: 'alert'})
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <LoadingState title="Đang tải danh sách bàn…" />
    }

    if (error) {
        return <ErrorState description={error} onRetry={() => void loadTables()} />
    }

    return (
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    eyebrow="Vận hành"
                    title="Quản lý bàn"
                    description={`${stats.active} bàn đang dùng · ${stats.seats} chỗ ngồi. Bàn đã cất vẫn giữ nguyên lịch sử đơn cho báo cáo.`}
                    icon={<Grid2x2 className="rk-icon" aria-hidden="true" />}
                    actions={
                        <button
                            type="button"
                            className="rk-btn rk-btn--primary"
                            onClick={openCreate}
                        >
                            <Plus className="rk-icon" aria-hidden="true" />
                            Thêm bàn
                        </button>
                    }
                />
            </PageCard>

            {/* Bộ lọc mang luôn con số, thay vì một hàng thẻ thống kê lặp lại
                đúng ba con số đó ngay bên cạnh. */}
            <section className="rk-statrow" aria-label="Lọc theo tình trạng sử dụng">
                {(
                    [
                        ['ALL', 'Tất cả', tables.length],
                        ['ACTIVE', 'Đang dùng', stats.active],
                        ['PARKED', 'Đã cất', stats.parked],
                    ] as const
                ).map(([value, label, count]) => (
                    <button
                        key={value}
                        type="button"
                        className={`rk-stat rk-stat--tab${
                            usageFilter === value ? ' rk-stat--active' : ''
                        }`}
                        aria-pressed={usageFilter === value}
                        onClick={() => {
                            setUsageFilter(value)
                            setPage(1)
                        }}
                    >
                        <span className="rk-stat__label">{label}</span>
                        <span className="rk-stat__value">{count}</span>
                    </button>
                ))}
            </section>

            <PageCard>
                {pageRows.length === 0 ? (
                    <EmptyState
                        title="Chưa có bàn nào ở đây"
                        description="Thêm bàn đầu tiên để Phục vụ có sơ đồ mà bấm vào."
                    />
                ) : (
                    <>
                        <div className="rk-tablewrap">
                            <table className="rk-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Số bàn</th>
                                        <th scope="col">Số chỗ</th>
                                        <th scope="col">Tình trạng</th>
                                        <th scope="col">Đã dùng</th>
                                        <th scope="col">Trong sơ đồ</th>
                                        <th scope="col">Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pageRows.map((table) => {
                                        const busy = busyReason(table)

                                        return (
                                            <tr key={table.id}>
                                                <td>
                                                    <strong>{table.tableNumber}</strong>
                                                </td>

                                                <td>{table.capacity} chỗ</td>

                                                <td>
                                                    <span
                                                        className={
                                                            STATUS_CHIP[table.status]
                                                        }
                                                    >
                                                        {STATUS_LABEL[table.status]}
                                                    </span>
                                                </td>

                                                <td>
                                                    {table.orderCount === 0 &&
                                                    table.reservationCount === 0
                                                        ? 'Chưa dùng lần nào'
                                                        : `${table.orderCount} đơn · ${table.reservationCount} lần đặt`}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            table.active
                                                                ? 'rk-chip rk-chip--ok'
                                                                : 'rk-chip'
                                                        }
                                                    >
                                                        {table.active
                                                            ? 'Đang dùng'
                                                            : 'Đã cất'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="rk-iconbtn rk-iconbtn--brand"
                                                        title="Sửa bàn"
                                                        onClick={() => openEdit(table)}
                                                    >
                                                        <Pencil
                                                            className="rk-icon"
                                                            aria-hidden="true"
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="rk-iconbtn"
                                                        /* Bật lại bàn thì không cần bàn phải rảnh */
                                                        disabled={Boolean(
                                                            table.active && busy,
                                                        )}
                                                        title={
                                                            table.active
                                                                ? (busy ??
                                                                  'Cất khỏi sơ đồ')
                                                                : 'Đưa trở lại sơ đồ'
                                                        }
                                                        onClick={() =>
                                                            void toggleActive(table)
                                                        }
                                                    >
                                                        {table.active ? (
                                                            <EyeOff
                                                                className="rk-icon"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <RotateCcw
                                                                className="rk-icon"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="rk-iconbtn rk-iconbtn--danger"
                                                        disabled={Boolean(busy)}
                                                        title={
                                                            busy ??
                                                            (table.deletable
                                                                ? 'Xoá bàn'
                                                                : 'Bàn đã có lịch sử, chỉ cất đi được')
                                                        }
                                                        onClick={() =>
                                                            setRemoveTarget(table)
                                                        }
                                                    >
                                                        <Trash2
                                                            className="rk-icon"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            page={safePage}
                            totalPages={totalPages}
                            totalItems={visibleTables.length}
                            onPageChange={setPage}
                        />
                    </>
                )}
            </PageCard>

            <Modal
                open={formOpen}
                title={editing ? `Sửa bàn ${editing.tableNumber}` : 'Thêm bàn mới'}
                description={
                    editing
                        ? 'Đổi số bàn hay số chỗ ngồi. Bàn đang phục vụ vẫn sửa được.'
                        : 'Bàn mới luôn bắt đầu ở trạng thái trống.'
                }
                onClose={() => setFormOpen(false)}
                footer={
                    <>
                        <button
                            type="button"
                            className="rk-btn"
                            onClick={() => setFormOpen(false)}
                        >
                            Huỷ bỏ
                        </button>

                        <button
                            type="submit"
                            form="table-form"
                            className="rk-btn rk-btn--primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang lưu…' : 'Lưu'}
                        </button>
                    </>
                }
            >
                <form id="table-form" className="rk-fieldgroup" onSubmit={handleSubmit}>
                    <div className="rk-field">
                        <label className="rk-field__label" htmlFor="table-number">
                            Số bàn
                        </label>

                        <input
                            id="table-number"
                            className="rk-input"
                            type="text"
                            value={form.tableNumber}
                            maxLength={20}
                            placeholder="Ví dụ: T13"
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    tableNumber: event.target.value,
                                }))
                            }
                        />

                        <p className="rk-field__hint">
                            Đặt theo lối nào cũng được, miễn không trùng bàn đã có.
                        </p>
                    </div>

                    <div className="rk-field">
                        <label className="rk-field__label" htmlFor="table-capacity">
                            Số chỗ ngồi
                        </label>

                        <input
                            id="table-capacity"
                            className="rk-input"
                            type="number"
                            min={1}
                            max={100}
                            value={form.capacity}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    capacity: event.target.value,
                                }))
                            }
                        />
                    </div>

                    {formError && <p className="rk-formerror">{formError}</p>}
                </form>
            </Modal>

            <ConfirmDialog
                open={removeTarget !== null}
                title={
                    removeTarget?.deletable
                        ? `Xoá bàn ${removeTarget.tableNumber}?`
                        : `Cất bàn ${removeTarget?.tableNumber}?`
                }
                description={
                    removeTarget?.deletable
                        ? 'Bàn này chưa dùng lần nào nên sẽ bị xoá hẳn. Không hoàn tác được.'
                        : 'Bàn đã có đơn hoặc lần đặt nên chỉ được cất khỏi sơ đồ. Lịch sử vẫn giữ nguyên cho báo cáo, và có thể đưa bàn trở lại bất cứ lúc nào.'
                }
                confirmLabel={removeTarget?.deletable ? 'Xoá vĩnh viễn' : 'Cất bàn'}
                destructive={removeTarget?.deletable ?? false}
                busy={submitting}
                onConfirm={() => void confirmRemove()}
                onCancel={() => setRemoveTarget(null)}
            />
        </div>
    )
}
