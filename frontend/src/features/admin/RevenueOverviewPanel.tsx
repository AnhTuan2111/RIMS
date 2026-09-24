import {CalendarDays, Crown, FileText, Soup, Trophy, Wallet} from 'lucide-react'
import {useEffect, useState} from 'react'
import {useAdminSocket} from '@/realtime/useAdminSocket'
import * as adminApi from '@/shared/api/admin'
import {EmptyState} from '@/shared/components/feedback'
import {PageCard, StatCard} from '@/shared/components/ui'
import type {
    BestSellingDishItem,
    OrderShiftItem,
    OrderShiftReportResponse,
    RevenueReportResponse,
    WeeklyRevenueChartResponse,
} from '@/shared/api/admin'
import {getErrorMessage} from '@/shared/utils/error'

interface WeekOption {
    value: string
    label: string
    fromDate: string
    toDate: string
}

interface ShiftViewItem extends OrderShiftItem {
    color: string
}

interface WeeklyRevenueOverviewData {
    revenue: RevenueReportResponse | null
    dailyRevenue: WeeklyRevenueChartResponse | null
    bestSellers: BestSellingDishItem[]
    orderShiftReport: OrderShiftReportResponse | null
}

const emptyWeeklyRevenueOverviewData: WeeklyRevenueOverviewData = {
    revenue: null,
    dailyRevenue: null,
    bestSellers: [],
    orderShiftReport: null,
}

const shiftCatalog = [
    {
        shiftName: 'MORNING',
        displayName: 'Ca sáng',
        startTime: '08:00',
        endTime: '10:59',
        color: 'var(--rims-chart-1)',
    },
    {
        shiftName: 'NOON',
        displayName: 'Ca trưa',
        startTime: '11:00',
        endTime: '13:59',
        color: 'var(--rims-chart-2)',
    },
    {
        shiftName: 'AFTERNOON',
        displayName: 'Ca chiều',
        startTime: '14:00',
        endTime: '16:59',
        color: 'var(--rims-chart-3)',
    },
    {
        shiftName: 'EVENING',
        displayName: 'Ca tối',
        startTime: '17:00',
        endTime: '22:00',
        color: 'var(--rims-chart-4)',
    },
]

function formatDateForApi(date: Date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')

    return `${year}-${month}-${day}`
}

function addDays(date: Date, amount: number) {
    const nextDate = new Date(date)

    nextDate.setDate(nextDate.getDate() + amount)

    return nextDate
}

function parseApiDate(date: string) {
    const [year, month, day] = date.split('-').map(Number)

    return new Date(year, month - 1, day)
}

function getWeekdayLabel(date: Date) {
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

    return labels[date.getDay()]
}

function getSundayOfWeek(date: Date) {
    const sunday = new Date(date)
    const day = sunday.getDay()
    const daysUntilSunday = day === 0 ? 0 : 7 - day

    sunday.setDate(sunday.getDate() + daysUntilSunday)

    return sunday
}

function getNextMonday(date: Date) {
    const nextMonday = new Date(date)
    const day = nextMonday.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day

    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)

    return nextMonday
}

function formatShortDate(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
    }).format(date)
}

function buildWeekOptions(year: number): WeekOption[] {
    const today = new Date()
    const currentYear = today.getFullYear()
    const endOfYear = new Date(year, 11, 31)
    const options: WeekOption[] = []

    let weekStart = new Date(year, 0, 1)

    while (
        weekStart.getFullYear() === year &&
        (year < currentYear || weekStart <= today)
    ) {
        const weekEnd = getSundayOfWeek(weekStart)
        const boundedEnd =
            year === currentYear && weekEnd > today
                ? today
                : weekEnd > endOfYear
                  ? endOfYear
                  : weekEnd

        options.push({
            value: formatDateForApi(weekStart),
            label: `${formatShortDate(weekStart)} - ${formatShortDate(boundedEnd)}`,
            fromDate: formatDateForApi(weekStart),
            toDate: formatDateForApi(boundedEnd),
        })

        weekStart = getNextMonday(weekStart)
    }

    return options
}

function getDefaultWeek(year: number) {
    const options = buildWeekOptions(year)

    return (
        options[options.length - 1] ?? {
            value: formatDateForApi(new Date()),
            label: formatShortDate(new Date()),
            fromDate: formatDateForApi(new Date()),
            toDate: formatDateForApi(new Date()),
        }
    )
}

function formatDisplayDate(date: string) {
    const [year, month, day] = date.split('-')

    return `${day}/${month}/${year}`
}

function formatWeekRangeLabel(week: WeekOption) {
    return `${formatDisplayDate(week.fromDate)} - ${formatDisplayDate(week.toDate)}`
}

function formatRevenueCurrency(value?: number | null) {
    return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} đ`
}

function formatNumber(value?: number | null) {
    return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

function formatDecimal(value?: number | null) {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
    }).format(value ?? 0)
}

function formatRevenueAxis(value: number) {
    return `${formatNumber(value)} đ`
}

function getDishInitial(dishName: string) {
    return dishName.trim().charAt(0).toUpperCase() || '?'
}

function resolveDishImageSrc(imageUrl?: string | null) {
    const value = imageUrl?.trim()

    if (!value) {
        return null
    }

    if (
        value.startsWith('http') ||
        value.startsWith('//') ||
        value.startsWith('data:') ||
        value.startsWith('/')
    ) {
        return value
    }

    return `/image/${value}`
}

function WeeklyBestSellerImage({
    dishName,
    imageUrl,
}: {
    dishName: string
    imageUrl?: string | null
}) {
    const [hasError, setHasError] = useState(false)
    const imageSrc = resolveDishImageSrc(imageUrl)

    if (!imageSrc || hasError) {
        return <span className="rk-thumb">{getDishInitial(dishName)}</span>
    }

    return (
        <img
            alt={dishName}
            className="rk-thumb"
            src={imageSrc}
            onError={() => setHasError(true)}
        />
    )
}

function buildShiftRows(report: OrderShiftReportResponse | null): ShiftViewItem[] {
    return shiftCatalog.map((shift) => {
        const apiShift = report?.shifts?.find(
            (item) => item.shiftName === shift.shiftName,
        )
        const fallbackShift =
            report?.highestOrderShift?.shiftName === shift.shiftName
                ? report.highestOrderShift
                : null

        return {
            ...shift,
            displayName: apiShift?.displayName ?? shift.displayName,
            startTime: apiShift?.startTime ?? shift.startTime,
            endTime: apiShift?.endTime ?? shift.endTime,
            orderCount: apiShift?.orderCount ?? fallbackShift?.orderCount ?? 0,
            percentage: apiShift?.percentage ?? fallbackShift?.percentage ?? 0,
        }
    })
}

function buildDonutGradient(rows: ShiftViewItem[]) {
    const totalOrders = rows.reduce((sum, row) => sum + row.orderCount, 0)

    if (totalOrders === 0) {
        return 'var(--rims-line)'
    }

    let cursor = 0

    return rows
        .map((row, index) => {
            const degrees =
                index === rows.length - 1
                    ? 360 - cursor
                    : (row.orderCount / totalOrders) * 360
            const nextCursor = cursor + degrees
            const segment = `${row.color} ${cursor}deg ${nextCursor}deg`

            cursor = nextCursor

            return segment
        })
        .join(', ')
}

function buildWeeklyRevenueRows(
    selectedWeek: WeekOption,
    dailyRevenue: WeeklyRevenueChartResponse | null,
) {
    const revenueByDate = new Map(
        (dailyRevenue?.items ?? []).map((item) => [item.date, Number(item.revenue ?? 0)]),
    )
    const rows = []
    const endDate = parseApiDate(selectedWeek.toDate)
    let cursor = parseApiDate(selectedWeek.fromDate)

    while (cursor <= endDate && rows.length < 7) {
        const date = formatDateForApi(cursor)
        const apiItem = dailyRevenue?.items?.find((item) => item.date === date)

        rows.push({
            date,
            label: apiItem?.dayLabel ?? getWeekdayLabel(cursor),
            revenue: revenueByDate.get(date) ?? 0,
        })

        cursor = addDays(cursor, 1)
    }

    return rows
}

function WeeklyRevenueLineChart({
    rows,
}: {
    rows: ReturnType<typeof buildWeeklyRevenueRows>
}) {
    const width = 760
    const height = 160
    const left = 92
    const right = 28
    const top = 10
    const bottom = 126
    const plotWidth = width - left - right
    const plotHeight = bottom - top
    const maxRevenue = Math.max(1_500_000, ...rows.map((row) => row.revenue))
    const tickStep = Math.max(300_000, Math.ceil(maxRevenue / 5 / 100_000) * 100_000)
    const maxTick = tickStep * 5
    const tickValues = Array.from(
        {
            length: 6,
        },
        (_, index) => maxTick - tickStep * index,
    )
    const denominator = Math.max(rows.length - 1, 1)
    const points = rows.map((row, index) => ({
        ...row,
        x: left + (plotWidth / denominator) * index,
        y: top + (1 - row.revenue / maxTick) * plotHeight,
    }))
    const linePath = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ')
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const areaPath =
        firstPoint && lastPoint
            ? `${linePath} L ${lastPoint.x} ${bottom} L ${firstPoint.x} ${bottom} Z`
            : ''

    return (
        <div className="rk-chart__shell">
            <svg
                aria-label="Biểu đồ doanh thu trong tuần"
                className="rk-chart"
                role="img"
                viewBox={`0 0 ${width} ${height}`}
            >
                <defs>
                    <linearGradient id="weekly-revenue-area" x1="0" x2="0" y1="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="var(--rims-brand)"
                            stopOpacity="0.28"
                        />
                        <stop
                            offset="100%"
                            stopColor="var(--rims-brand)"
                            stopOpacity="0.03"
                        />
                    </linearGradient>
                </defs>

                {tickValues.map((tick) => {
                    const y = top + (1 - tick / maxTick) * plotHeight

                    return (
                        <g key={tick}>
                            <line
                                className="rk-chart__grid"
                                x1={left}
                                x2={width - right}
                                y1={y}
                                y2={y}
                            />
                            <text
                                className="rk-chart__axis"
                                textAnchor="end"
                                x={left - 14}
                                y={y + 4}
                            >
                                {formatRevenueAxis(tick)}
                            </text>
                        </g>
                    )
                })}

                {areaPath && <path className="rk-chart__area" d={areaPath} />}
                {linePath && <path className="rk-chart__line" d={linePath} />}

                {points.map((point) => (
                    <g key={point.date}>
                        <circle
                            className="rk-chart__point"
                            cx={point.x}
                            cy={point.y}
                            r="5"
                        />
                        <text
                            className="rk-chart__axis"
                            textAnchor="middle"
                            x={point.x}
                            y={bottom + 29}
                        >
                            {point.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}

function WeeklyRevenueOverviewDashboard({
    selectedWeek,
    weekOptions,
    data,
    isLoading,
    error,
    onWeekChange,
    onReload,
}: {
    selectedWeek: WeekOption
    weekOptions: WeekOption[]
    data: WeeklyRevenueOverviewData
    isLoading: boolean
    error: string | null
    onWeekChange: (weekValue: string) => void
    onReload: () => void
}) {
    const revenue = data.revenue?.revenue ?? 0
    const bestSellers = data.bestSellers.slice(0, 5)
    const topDish = bestSellers[0]
    const maxQuantity = Math.max(1, ...bestSellers.map((item) => item.totalQuantity))
    const shiftRows = buildShiftRows(data.orderShiftReport)
    const highestShift = shiftRows.find(
        (row) => row.shiftName === data.orderShiftReport?.highestOrderShift?.shiftName,
    )
    const fallbackHighestShift = shiftRows.reduce(
        (bestShift, row) => (row.orderCount > bestShift.orderCount ? row : bestShift),
        shiftRows[0],
    )
    const featuredShift = highestShift ?? fallbackHighestShift
    const totalOrders =
        data.orderShiftReport?.totalPaidOrders ??
        shiftRows.reduce((sum, row) => sum + row.orderCount, 0)
    const donutGradient = buildDonutGradient(shiftRows)
    const chartRows = buildWeeklyRevenueRows(selectedWeek, data.dailyRevenue)

    return (
        <div aria-busy={isLoading} className="rk-stack">
            <PageCard>
                <div className="rk-card__head-inline">
                    <div>
                        <h2 className="rk-sectiontitle">Tổng quan tuần</h2>
                        <p className="rk-pagehead__desc">
                            Doanh thu, đơn hàng, món bán chạy và biến động kinh doanh
                            trong tuần.
                        </p>
                    </div>

                    <div className="rk-datefield__shell">
                        <CalendarDays className="rk-icon" aria-hidden="true" />

                        <select
                            aria-label="Chọn khoảng thời gian"
                            className="rk-select"
                            disabled={isLoading}
                            value={selectedWeek.value}
                            onChange={(event) => onWeekChange(event.target.value)}
                        >
                            {weekOptions.map((week) => (
                                <option key={week.value} value={week.value}>
                                    {formatWeekRangeLabel(week)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <p className="rk-note rk-note--alert">
                        <span>{error}</span>

                        <button
                            type="button"
                            className="rk-btn rk-btn--danger"
                            disabled={isLoading}
                            onClick={onReload}
                        >
                            Thử lại
                        </button>
                    </p>
                )}
            </PageCard>

            <div className="rk-statgrid">
                <StatCard
                    label="Doanh thu tuần"
                    value={formatRevenueCurrency(revenue)}
                    textValue
                    tone="brand"
                    icon={<Wallet className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Đơn đã thanh toán"
                    value={`${formatNumber(totalOrders)} đơn`}
                    textValue
                    tone="ok"
                    icon={<FileText className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Món bán chạy nhất"
                    value={topDish?.dishName ?? 'Chưa có dữ liệu'}
                    textValue
                    icon={<Soup className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Ca nhiều đơn nhất"
                    value={featuredShift?.displayName ?? 'Chưa có dữ liệu'}
                    textValue
                    tone="busy"
                    icon={<Trophy className="rk-icon" aria-hidden="true" />}
                />
            </div>

            <PageCard>
                <h3 className="rk-sectiontitle">Biểu đồ doanh thu trong tuần</h3>
                <WeeklyRevenueLineChart rows={chartRows} />
            </PageCard>

            <div className="rk-two">
                <PageCard>
                    <h3 className="rk-sectiontitle">Top món bán chạy</h3>

                    {bestSellers.length === 0 ? (
                        <EmptyState
                            title="Chưa có dữ liệu món bán chạy"
                            description="Tuần này chưa ghi nhận đơn nào."
                        />
                    ) : (
                        <div className="rk-rowlist">
                            {bestSellers.map((item, index) => {
                                const rank = item.rank ?? index + 1

                                return (
                                    <div
                                        className="rk-rowlist__item"
                                        key={`${rank}-${item.dishName}`}
                                    >
                                        <div className="rk-media">
                                            <span
                                                className={`rk-rank${rank <= 3 ? ` rk-rank--${rank}` : ''}`}
                                            >
                                                {rank === 1 ? (
                                                    <Crown
                                                        className="rk-icon"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    rank
                                                )}
                                            </span>

                                            <WeeklyBestSellerImage
                                                dishName={item.dishName}
                                                imageUrl={item.imageUrl}
                                            />

                                            <div className="rk-rowlist__main">
                                                <div className="rk-rowlist__title">
                                                    {item.dishName}
                                                </div>

                                                <div className="rk-bar">
                                                    <div
                                                        className="rk-bar__fill"
                                                        style={{
                                                            width: `${Math.max(
                                                                8,
                                                                (item.totalQuantity /
                                                                    maxQuantity) *
                                                                    100,
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <strong className="rk-num">
                                            {formatNumber(item.totalQuantity)}
                                        </strong>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </PageCard>

                <PageCard>
                    <h3 className="rk-sectiontitle">Tỉ trọng đơn theo ca</h3>

                    <div className="rk-donutrow">
                        <div
                            className="rk-donut"
                            style={{
                                background: `conic-gradient(from -90deg, ${donutGradient})`,
                            }}
                        >
                            <div className="rk-donut__hole">
                                <span className="rk-donut__value">
                                    {formatNumber(totalOrders)}
                                </span>
                                <span className="rk-donut__label">đơn</span>
                            </div>
                        </div>

                        <ul className="rk-legend rk-legend--stack">
                            {shiftRows.map((row) => (
                                <li className="rk-legend__item" key={row.shiftName}>
                                    <span
                                        className="rk-legend__dot"
                                        style={{background: row.color}}
                                    />

                                    <div>
                                        <div className="rk-rowlist__title">
                                            {row.displayName}
                                        </div>

                                        <p className="rk-rowlist__meta">
                                            {formatNumber(row.orderCount)} đơn ·{' '}
                                            {formatDecimal(row.percentage)}%
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </PageCard>
            </div>
        </div>
    )
}

export default function AdminRevenueOverviewDashboard() {
    const [selectedWeek, setSelectedWeek] = useState<WeekOption>(() =>
        getDefaultWeek(new Date().getFullYear()),
    )
    const [overviewData, setOverviewData] = useState<WeeklyRevenueOverviewData>(
        emptyWeeklyRevenueOverviewData,
    )
    const [overviewError, setOverviewError] = useState<string | null>(null)
    const [isOverviewLoading, setIsOverviewLoading] = useState(false)
    const weekOptions = buildWeekOptions(new Date().getFullYear())

    useAdminSocket(() => {
        void loadWeeklyRevenueOverview(selectedWeek, false)
    })

    async function loadWeeklyRevenueOverview(
        week: WeekOption = selectedWeek,
        showFullLoading = true,
        signal?: AbortSignal,
    ) {
        try {
            if (showFullLoading) {
                setIsOverviewLoading(true)
            }

            setOverviewError(null)

            const [revenue, dailyRevenue, bestSellingReport, orderShiftReport] =
                await Promise.all([
                    adminApi.getCustomRevenue(week.fromDate, week.toDate, signal),
                    adminApi.getDailyRevenue(week.fromDate, week.toDate, signal),
                    adminApi.getBestSellingReportBetween(
                        week.fromDate,
                        week.toDate,
                        undefined,
                        signal,
                    ),
                    adminApi.getOrderShiftReportBetween(
                        week.fromDate,
                        week.toDate,
                        signal,
                    ),
                ])

            setOverviewData({
                revenue: revenue.data,
                dailyRevenue: dailyRevenue.data,
                bestSellers: bestSellingReport.data.items ?? [],
                orderShiftReport: orderShiftReport.data,
            })
        } catch (error) {
            if (signal?.aborted) {
                return
            }

            console.error(error)
            setOverviewError(
                getErrorMessage(
                    error,
                    'Không thể tải dashboard tổng quan doanh thu tuần.',
                ),
            )
        } finally {
            if (showFullLoading && !signal?.aborted) {
                setIsOverviewLoading(false)
            }
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        void loadWeeklyRevenueOverview(selectedWeek, true, controller.signal)

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleWeekChange(weekValue: string) {
        const nextWeek = weekOptions.find((week) => week.value === weekValue)

        if (!nextWeek) {
            return
        }

        setSelectedWeek(nextWeek)
        void loadWeeklyRevenueOverview(nextWeek, true)
    }

    return (
        <div>
            <WeeklyRevenueOverviewDashboard
                data={overviewData}
                error={overviewError}
                isLoading={isOverviewLoading}
                selectedWeek={selectedWeek}
                weekOptions={weekOptions}
                onReload={() => void loadWeeklyRevenueOverview(selectedWeek, true)}
                onWeekChange={handleWeekChange}
            />
        </div>
    )
}
