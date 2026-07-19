import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react'

import {adminApi} from '../../api/admin'
import type {TableDetailResponse} from '../../api/waiter'
import {REALTIME_CONFIG} from '../../app/config/realtime'
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '../../components/feedback'
import {
    PageCard,
    PageHeader,
} from '../../components/ui'
import {usePolling} from '../../hooks/usePolling'

function getTableStatusLabel(status: TableDetailResponse['status']) {
    switch (status) {
        case 'AVAILABLE':
            return 'Bàn trống'

        case 'SERVING':
            return 'Đang phục vụ'

        case 'RESERVED':
            return 'Đã đặt trước'

        default:
            return status
    }
}

function getTableStatusClass(status: TableDetailResponse['status']) {
    switch (status) {
        case 'AVAILABLE':
            return 'completed'

        case 'SERVING':
            return 'preparing'

        case 'RESERVED':
            return 'warning'

        default:
            return ''
    }
}

export default function AdminTablesPage() {
    const [tables, setTables] =
        useState<TableDetailResponse[]>([])

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] =
        useState<string | null>(null)

    const hasLoadedInitialTablesRef = useRef(false)

    const loadTables = useCallback(
        async (
            signal?: AbortSignal,
            showFullLoading = true,
            resetError = true,
        ) => {
            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                if (resetError) {
                    setError(null)
                }

                const response = await adminApi.getTables(signal)

                setTables(response.data)
                setError(null)
            } catch (requestError: unknown) {
                if (signal?.aborted) {
                    return
                }

                console.error(
                    '[ADMIN_TABLES_FETCH_ERROR]',
                    requestError,
                )

                setError(
                    'Không thể tải danh sách bàn.',
                )
            } finally {
                if (showFullLoading && !signal?.aborted) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    usePolling(
        async (signal) => {
            const isInitialLoad =
                !hasLoadedInitialTablesRef.current

            await loadTables(
                signal,
                isInitialLoad,
                isInitialLoad,
            )

            hasLoadedInitialTablesRef.current = true
        },
        {
            intervalMs:
            REALTIME_CONFIG
                .admin
                .dashboardIntervalMs,

            runImmediately: true,
            pauseWhenHidden: true,

            onError: (requestError) => {
                console.error(
                    '[ADMIN_TABLES_POLL_ERROR]',
                    requestError,
                )
            },
        },
    )

    const statistics = useMemo(() => {
        const totalTables = tables.length

        const availableTables =
            tables.filter(
                (table) =>
                    table.status === 'AVAILABLE',
            ).length

        const occupiedTables =
            tables.filter(
                (table) =>
                    table.status === 'SERVING',
            ).length

        const reservedTables =
            tables.filter(
                (table) =>
                    table.status === 'RESERVED',
            ).length

        return {
            totalTables,
            availableTables,
            occupiedTables,
            reservedTables,
        }
    }, [tables])

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải danh sách bàn..."
                description="Hệ thống đang lấy trạng thái bàn mới nhất."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadTables(
                        undefined,
                        true,
                        true,
                    ).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <PageCard>
            <PageHeader
                title="Quản lý bàn"
                description="Admin có thể quản lý số bàn, sức chứa và trạng thái bàn trong nhà hàng."
                actions={
                    <button
                        type="button"
                        className="primary-button"
                    >
                        Thêm bàn
                    </button>
                }
            />

            <div className="stat-grid">
                <div className="stat-card">
                    <strong>
                        {statistics.totalTables}
                    </strong>

                    <span>Tổng số bàn</span>
                </div>

                <div className="stat-card">
                    <strong>
                        {statistics.availableTables}
                    </strong>

                    <span>Bàn trống</span>
                </div>

                <div className="stat-card">
                    <strong>
                        {statistics.occupiedTables}
                    </strong>

                    <span>Đang phục vụ</span>
                </div>

                <div className="stat-card">
                    <strong>
                        {statistics.reservedTables}
                    </strong>

                    <span>Đã đặt trước</span>
                </div>
            </div>

            {tables.length === 0 ? (
                <EmptyState
                    title="Chưa có bàn"
                    description="Hiện hệ thống chưa có bàn nào để hiển thị."
                    action={
                        <button
                            type="button"
                            className="primary-button"
                        >
                            Thêm bàn
                        </button>
                    }
                />
            ) : (
                <div className="table-grid">
                    {tables.map((table) => (
                        <div
                            className="table-card"
                            key={table.tableId}
                        >
                            <strong>
                                Bàn {table.tableNumber}
                            </strong>

                            <span>
                                {table.capacity} người
                            </span>

                            <small
                                className={
                                    `status-badge ${
                                        getTableStatusClass(
                                            table.status,
                                        )
                                    }`
                                }
                            >
                                {getTableStatusLabel(
                                    table.status,
                                )}
                            </small>
                        </div>
                    ))}
                </div>
            )}
        </PageCard>
    )
}