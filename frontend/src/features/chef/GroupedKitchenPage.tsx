import {useCallback, useEffect, useMemo, useState} from 'react'
import {Link} from 'react-router-dom'

import {
    completeGroupedKitchenOrders,
    getGroupedKitchenOrders,
    type GroupedKitchenOrderResponse,
} from '@/shared/api/chef'
import {useKitchenSocket} from '@/realtime'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader, Pagination} from '@/shared/components/ui'
import {useToast} from '@/app/providers/useToast'

const ITEMS_PER_PAGE = 6

type GroupFilter = 'ALL' | 'GROUPABLE' | 'WITH_NOTE'

type SortOrder = 'OLDEST' | 'NEWEST' | 'QUANTITY_DESC'

function getTimeValue(value?: string) {
    if (!value) {
        return 0
    }

    const time = new Date(value).getTime()

    return Number.isNaN(time) ? 0 : time
}

function getWaitingMinutes(value?: string) {
    const createdTime = getTimeValue(value)

    if (!createdTime) {
        return 0
    }

    return Math.max(0, Math.floor((Date.now() - createdTime) / 60_000))
}

/**
 * Thời gian chờ viết cho người đọc.
 *
 * <p>Bản cũ luôn in ra phút. Đơn nằm từ hôm trước thì thành "Chờ 84225 phút" —
 * đúng về số nhưng không ai đọc ra được là gần hai tháng.
 */
function formatWaiting(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} phút`
    }

    if (minutes < 1440) {
        const hours = Math.floor(minutes / 60)
        const rest = minutes % 60

        return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`
    }

    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)

    return hours ? `${days} ngày ${hours} giờ` : `${days} ngày`
}

/**
 * Chip thời gian chờ, đổi màu theo mức độ trễ.
 *
 * <p>Màu KHÔNG phải tín hiệu duy nhất: chip luôn ghi rõ số phút bằng chữ.
 */
function getWaitingChip(minutes: number) {
    if (minutes >= 15) {
        return 'rk-chip rk-chip--alert'
    }

    if (minutes >= 10) {
        return 'rk-chip rk-chip--busy'
    }

    return 'rk-chip rk-chip--idle'
}

export default function GroupedKitchenPage() {
    const {notify} = useToast()

    const [groups, setGroups] = useState<GroupedKitchenOrderResponse[]>([])

    const [searchText, setSearchText] = useState('')

    const [selectedTable, setSelectedTable] = useState('ALL')

    const [groupFilter, setGroupFilter] = useState<GroupFilter>('ALL')

    const [sortOrder, setSortOrder] = useState<SortOrder>('OLDEST')

    const [currentPage, setCurrentPage] = useState(1)

    const [completingGroupKey, setCompletingGroupKey] = useState<string | null>(null)

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    const loadGroups = useCallback(
        async (showFullLoading: boolean, resetPage: boolean, signal?: AbortSignal) => {
            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                const data = await getGroupedKitchenOrders(signal)

                setGroups(data)
                setError(null)

                if (resetPage) {
                    setCurrentPage(1)
                }
            } catch (requestError) {
                if (signal?.aborted) {
                    return
                }

                console.error('[CHEF_GROUPED_ORDERS_FETCH_ERROR]', requestError)

                setError('Không thể tải danh sách gom món.')
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    // Initial load on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadGroups(true, false)
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadGroups])

    // WebSocket: refresh when backend broadcasts a kitchen update
    useKitchenSocket(() => void loadGroups(false, false))

    async function handleCompleteGroup(group: GroupedKitchenOrderResponse) {
        try {
            setCompletingGroupKey(group.groupKey)

            await completeGroupedKitchenOrders(
                group.items.map((item) => item.orderItemId),
            )

            await loadGroups(false, true)
        } catch (requestError) {
            console.error(requestError)

            notify('Không thể hoàn thành nhóm món.', {tone: 'alert'})
        } finally {
            setCompletingGroupKey(null)
        }
    }

    function clearFilters() {
        setSearchText('')
        setSelectedTable('ALL')
        setGroupFilter('ALL')
        setSortOrder('OLDEST')
        setCurrentPage(1)
    }

    const tableNumbers = useMemo(() => {
        return Array.from(
            new Set(
                groups.flatMap((group) => group.items.map((item) => item.tableNumber)),
            ),
        ).sort((first, second) => first.localeCompare(second, 'vi', {numeric: true}))
    }, [groups])

    const filteredGroups = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()

        return [...groups]
            .filter((group) => {
                const matchesSearch =
                    keyword === '' ||
                    group.dishName.toLowerCase().includes(keyword) ||
                    (group.note ?? '').toLowerCase().includes(keyword) ||
                    group.items.some(
                        (item) =>
                            item.tableNumber.toLowerCase().includes(keyword) ||
                            String(item.orderId).includes(keyword) ||
                            String(item.orderItemId).includes(keyword),
                    )

                const matchesTable =
                    selectedTable === 'ALL' ||
                    group.items.some((item) => item.tableNumber === selectedTable)

                const matchesType =
                    groupFilter === 'ALL' ||
                    (groupFilter === 'GROUPABLE' && !group.hasNote) ||
                    (groupFilter === 'WITH_NOTE' && group.hasNote)

                return matchesSearch && matchesTable && matchesType
            })
            .sort((first, second) => {
                if (sortOrder === 'QUANTITY_DESC') {
                    return second.totalQuantity - first.totalQuantity
                }

                const firstTime = getTimeValue(first.earliestCreatedAt)

                const secondTime = getTimeValue(second.earliestCreatedAt)

                if (sortOrder === 'NEWEST') {
                    return secondTime - firstTime
                }

                if (firstTime !== secondTime) {
                    return firstTime - secondTime
                }

                if (first.hasNote !== second.hasNote) {
                    return first.hasNote ? -1 : 1
                }

                if (first.totalQuantity !== second.totalQuantity) {
                    return second.totalQuantity - first.totalQuantity
                }

                return first.dishName.localeCompare(second.dishName, 'vi')
            })
    }, [groups, searchText, selectedTable, groupFilter, sortOrder])

    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / ITEMS_PER_PAGE))

    const safeCurrentPage = Math.min(currentPage, totalPages)

    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE

    const paginatedGroups = filteredGroups.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    function handlePageChange(page: number) {
        const nextPage = Math.min(Math.max(page, 1), totalPages)

        setCurrentPage(nextPage)

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải danh sách gom món…"
                description="Hệ thống đang lấy dữ liệu nhóm món mới nhất từ bếp."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadGroups(true, true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    title="Gom món để nấu"
                    description={`${groups.length} nhóm cần nấu · ${groups.reduce(
                        (total, group) => total + group.totalQuantity,
                        0,
                    )} phần. Món giống nhau và không có ghi chú được gom thành một nhóm; món có ghi chú luôn tách riêng.`}
                    actions={
                        <button
                            type="button"
                            className="rk-btn rk-btn--quiet"
                            onClick={() => {
                                loadGroups(true, true).catch((requestError) => {
                                    console.error(requestError)
                                })
                            }}
                        >
                            Làm mới
                        </button>
                    }
                />
            </PageCard>

            <PageCard>
                <div className="rk-filterbar">
                    <input
                        type="search"
                        value={searchText}
                        placeholder="Tìm theo tên món, bàn, mã đơn hoặc ghi chú…"
                        onChange={(event) => {
                            setSearchText(event.target.value)
                            setCurrentPage(1)
                        }}
                    />

                    <select
                        value={selectedTable}
                        onChange={(event) => {
                            setSelectedTable(event.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tất cả bàn</option>

                        {tableNumbers.map((tableNumber) => (
                            <option key={tableNumber} value={tableNumber}>
                                Bàn {tableNumber}
                            </option>
                        ))}
                    </select>

                    <select
                        value={groupFilter}
                        onChange={(event) => {
                            const nextFilter = event.target.value as GroupFilter

                            setGroupFilter(nextFilter)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tất cả nhóm</option>

                        <option value="GROUPABLE">Có thể nấu chung</option>

                        <option value="WITH_NOTE">Có ghi chú</option>
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            const nextSortOrder = event.target.value as SortOrder

                            setSortOrder(nextSortOrder)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="OLDEST">Chờ lâu nhất</option>

                        <option value="NEWEST">Mới nhất</option>

                        <option value="QUANTITY_DESC">Số lượng lớn nhất</option>
                    </select>

                    <button
                        type="button"
                        className="rk-btn rk-btn--quiet"
                        onClick={clearFilters}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </PageCard>

            {filteredGroups.length === 0 ? (
                <EmptyState
                    title="Không có nhóm món phù hợp"
                    description="Hãy thay đổi từ khóa hoặc bộ lọc."
                    action={
                        <button
                            type="button"
                            className="rk-btn rk-btn--quiet"
                            onClick={clearFilters}
                        >
                            Xóa bộ lọc
                        </button>
                    }
                />
            ) : (
                <>
                    <div className="rk-cardgrid">
                        {paginatedGroups.map((group) => {
                            const waitingMinutes = getWaitingMinutes(
                                group.earliestCreatedAt,
                            )

                            const waitingChip = getWaitingChip(waitingMinutes)

                            return (
                                <article
                                    className={
                                        group.hasNote
                                            ? 'rk-card rk-card--pad rk-card--flagged'
                                            : 'rk-card rk-card--pad'
                                    }
                                    key={group.groupKey}
                                >
                                    <div className="rk-card__head-inline">
                                        <div>
                                            <span
                                                className={
                                                    group.hasNote
                                                        ? 'rk-tag rk-tag--alert'
                                                        : 'rk-tag'
                                                }
                                            >
                                                {group.hasNote
                                                    ? 'Có ghi chú — làm riêng'
                                                    : 'Gom chung'}
                                            </span>

                                            <h3>{group.dishName}</h3>

                                            <p>
                                                {group.items.length} dòng món ·{' '}
                                                {
                                                    new Set(
                                                        group.items.map(
                                                            (item) => item.tableNumber,
                                                        ),
                                                    ).size
                                                }{' '}
                                                bàn
                                            </p>
                                        </div>

                                        <div className="rk-qty">
                                            <span className="rk-qty__num">
                                                x{group.totalQuantity}
                                            </span>
                                            <span className="rk-qty__unit">tổng</span>
                                        </div>
                                    </div>

                                    <span className={waitingChip}>
                                        Chờ {formatWaiting(waitingMinutes)}
                                    </span>

                                    {group.hasNote && (
                                        <div className="rk-note">
                                            <strong>Ghi chú:</strong> {group.note}
                                        </div>
                                    )}

                                    <div className="rk-rowlist">
                                        {group.items.map((item) => (
                                            <div
                                                className={
                                                    item.tableNumber === selectedTable
                                                        ? 'rk-rowlist__item is-highlighted'
                                                        : 'rk-rowlist__item'
                                                }
                                                key={item.orderItemId}
                                            >
                                                <div className="rk-rowlist__main">
                                                    <div className="rk-rowlist__title">
                                                        Bàn {item.tableNumber}
                                                    </div>

                                                    <p className="rk-rowlist__meta">
                                                        Order #{item.orderId} · Item #
                                                        {item.orderItemId}
                                                    </p>
                                                </div>

                                                <strong className="rk-num">
                                                    x{item.quantity}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rk-actions rk-actions--end">
                                        <Link
                                            className="rk-btn rk-btn--quiet"
                                            to="/chef/orders"
                                        >
                                            Xem từng đơn
                                        </Link>

                                        <button
                                            type="button"
                                            className="rk-btn rk-btn--primary"
                                            disabled={
                                                completingGroupKey === group.groupKey
                                            }
                                            onClick={() => {
                                                handleCompleteGroup(group).catch(
                                                    (requestError) => {
                                                        console.error(requestError)
                                                    },
                                                )
                                            }}
                                        >
                                            {completingGroupKey === group.groupKey
                                                ? 'Đang cập nhật…'
                                                : group.hasNote
                                                  ? 'Xong món'
                                                  : 'Xong cả nhóm'}
                                        </button>
                                    </div>
                                </article>
                            )
                        })}
                    </div>

                    <Pagination
                        page={safeCurrentPage}
                        totalPages={totalPages}
                        totalItems={filteredGroups.length}
                        pageSize={ITEMS_PER_PAGE}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    )
}
