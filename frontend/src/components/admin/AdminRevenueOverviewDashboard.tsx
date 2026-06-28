import { useEffect, useState, type ReactNode } from 'react'
import {
    adminApi,
    type BestSellingDishItem,
    type OrderShiftItem,
    type OrderShiftReportResponse,
    type RevenueComparisonResponse,
    type RevenueReportResponse,
    type WeeklyRevenueChartResponse,
} from '../../api/admin'

type StatusTone = 'positive' | 'negative' | 'neutral'

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
    comparison: RevenueComparisonResponse | null
    dailyRevenue: WeeklyRevenueChartResponse | null
    bestSellers: BestSellingDishItem[]
    orderShiftReport: OrderShiftReportResponse | null
}

const emptyWeeklyRevenueOverviewData: WeeklyRevenueOverviewData = {
    revenue: null,
    comparison: null,
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
        color: '#16a34a',
    },
    {
        shiftName: 'NOON',
        displayName: 'Ca trưa',
        startTime: '11:00',
        endTime: '13:59',
        color: '#22c55e',
    },
    {
        shiftName: 'AFTERNOON',
        displayName: 'Ca chiều',
        startTime: '14:00',
        endTime: '16:59',
        color: '#f97316',
    },
    {
        shiftName: 'EVENING',
        displayName: 'Ca tối',
        startTime: '17:00',
        endTime: '22:00',
        color: '#ea580c',
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

function getPreviousWeekRange(week: WeekOption) {
    const currentStartDate = parseApiDate(week.fromDate)
    const currentEndDate = parseApiDate(week.toDate)
    const daysInRange = Math.max(
        1,
        Math.round(
            (currentEndDate.getTime() - currentStartDate.getTime())
                / 86_400_000,
        ) + 1,
    )
    const previousEndDate = addDays(currentStartDate, -1)
    const previousStartDate = addDays(previousEndDate, -(daysInRange - 1))

    return {
        previousStartDate: formatDateForApi(previousStartDate),
        previousEndDate: formatDateForApi(previousEndDate),
    }
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
        weekStart.getFullYear() === year
        && (year < currentYear || weekStart <= today)
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
            label: `${formatShortDate(weekStart)} - ${formatShortDate(
                boundedEnd,
            )}`,
            fromDate: formatDateForApi(weekStart),
            toDate: formatDateForApi(boundedEnd),
        })

        weekStart = getNextMonday(weekStart)
    }

    return options
}

function getDefaultWeek(year: number) {
    const options = buildWeekOptions(year)

    return options[options.length - 1] ?? {
        value: formatDateForApi(new Date()),
        label: formatShortDate(new Date()),
        fromDate: formatDateForApi(new Date()),
        toDate: formatDateForApi(new Date()),
    }
}

function formatDisplayDate(date: string) {
    const [year, month, day] = date.split('-')

    return `${day}/${month}/${year}`
}

function formatWeekRangeLabel(week: WeekOption) {
    return `${formatDisplayDate(week.fromDate)} - ${formatDisplayDate(
        week.toDate,
    )}`
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

function formatSignedRevenueCurrency(value?: number | null) {
    const amount = value ?? 0
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''

    return `${sign}${formatRevenueCurrency(Math.abs(amount))}`
}

function formatSignedPercentage(value?: number | null) {
    const amount = value ?? 0
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    const formattedAmount = new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(Math.abs(amount))

    return `${sign}${formattedAmount}%`
}

function getDishInitial(dishName: string) {
    return dishName.trim().charAt(0).toUpperCase() || '?'
}

function getToneClass(value?: number | null): StatusTone {
    if ((value ?? 0) > 0) {
        return 'positive'
    }

    if ((value ?? 0) < 0) {
        return 'negative'
    }

    return 'neutral'
}

function getGrowthStatus(growthRate?: number | null) {
    if ((growthRate ?? 0) > 0) {
        return 'Doanh thu tăng'
    }

    if ((growthRate ?? 0) < 0) {
        return 'Doanh thu giảm'
    }

    return 'Doanh thu không đổi'
}

function getApiErrorMessage(error: unknown, fallback: string) {
    if (typeof error !== 'object' || error === null) {
        return fallback
    }

    const response = (
        error as {
            response?: {
                data?: {
                    error?: string
                    message?: string
                }
            }
        }
    ).response

    return response?.data?.message ?? response?.data?.error ?? fallback
}

function buildShiftRows(
    report: OrderShiftReportResponse | null,
): ShiftViewItem[] {
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
            orderCount:
                apiShift?.orderCount ?? fallbackShift?.orderCount ?? 0,
            percentage:
                apiShift?.percentage ?? fallbackShift?.percentage ?? 0,
        }
    })
}

function buildDonutGradient(rows: ShiftViewItem[]) {
    const totalOrders = rows.reduce(
        (sum, row) => sum + row.orderCount,
        0,
    )

    if (totalOrders === 0) {
        return '#e5e7eb'
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
        (dailyRevenue?.items ?? []).map((item) => [
            item.date,
            Number(item.revenue ?? 0),
        ]),
    )
    const rows = []
    const endDate = parseApiDate(selectedWeek.toDate)
    let cursor = parseApiDate(selectedWeek.fromDate)

    while (cursor <= endDate && rows.length < 7) {
        const date = formatDateForApi(cursor)
        const apiItem = dailyRevenue?.items?.find(
            (item) => item.date === date,
        )

        rows.push({
            date,
            label: apiItem?.dayLabel ?? getWeekdayLabel(cursor),
            revenue: revenueByDate.get(date) ?? 0,
        })

        cursor = addDays(cursor, 1)
    }

    return rows
}

function CalendarIcon() {
    return (
        <svg
            aria-hidden="true"
            className="admin-revenue-calendar-icon"
            viewBox="0 0 24 24"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <path d="M3 10h18" />
            <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        </svg>
    )
}

function FileIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
        >
            <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
            <path d="M14 2v5h5" />
            <path d="M9 13h6" />
            <path d="M9 17h6" />
        </svg>
    )
}

function TrophyIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
        >
            <path d="M8 21h8" />
            <path d="M12 17v4" />
            <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
            <path d="M7 6H4a2 2 0 0 0 2 4h1" />
            <path d="M17 6h3a2 2 0 0 1-2 4h-1" />
        </svg>
    )
}

function TrendingIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
        >
            <path d="M3 17 9 11l4 4 7-8" />
            <path d="M14 7h6v6" />
        </svg>
    )
}

function TrendStatusIcon({
    tone,
}: {
    tone: StatusTone
}) {
    const isNegative = tone === 'negative'
    const path = isNegative
        ? 'M3 7l6 6 4-4 8 8'
        : tone === 'positive'
          ? 'M3 17l6-6 4 4 8-8'
          : 'M3 12h18'
    const arrowPath = isNegative
        ? 'M15 17h6v-6'
        : tone === 'positive'
          ? 'M15 7h6v6'
          : ''

    return (
        <span className={`comparison-status-icon ${tone}`}>
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
            >
                <path d={path} />
                {arrowPath && <path d={arrowPath} />}
            </svg>
        </span>
    )
}

function MoneyIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
        >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}

function BowlIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
        >
            <path d="M4 11h16a7 7 0 0 1-14 0" />
            <path d="M6 18h12" />
            <path d="M8 7c0-1.5 2-1.5 2-3" />
            <path d="M12 7c0-1.5 2-1.5 2-3" />
            <path d="M16 7c0-1.5 2-1.5 2-3" />
        </svg>
    )
}

function ChevronDownIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function WeeklyOverviewKpiCard({
    title,
    value,
    caption,
    tone,
    icon,
    marker,
    featured = false,
}: {
    title: string
    value: ReactNode
    caption?: ReactNode
    tone: 'orange' | 'green' | 'red' | 'blue'
    icon: ReactNode
    marker?: ReactNode
    featured?: boolean
}) {
    return (
        <article
            className={
                featured
                    ? `weekly-overview-kpi-card tone-${tone} featured`
                    : `weekly-overview-kpi-card tone-${tone}`
            }
        >
            <div className="weekly-overview-kpi-top">
                <span className="weekly-overview-kpi-icon">
                    {icon}
                </span>
                {marker && (
                    <span className="weekly-overview-kpi-marker">
                        {marker}
                    </span>
                )}
            </div>
            <div className="weekly-overview-kpi-content">
                <span>{title}</span>
                <strong>{value}</strong>
                {caption && <small>{caption}</small>}
            </div>
        </article>
    )
}

function WeeklyRevenueLineChart({
    rows,
}: {
    rows: ReturnType<typeof buildWeeklyRevenueRows>
}) {
    const width = 760
    const height = 250
    const left = 92
    const right = 28
    const top = 14
    const bottom = 208
    const plotWidth = width - left - right
    const plotHeight = bottom - top
    const maxRevenue = Math.max(
        1_500_000,
        ...rows.map((row) => row.revenue),
    )
    const tickStep = Math.max(
        300_000,
        Math.ceil(maxRevenue / 5 / 100_000) * 100_000,
    )
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
        .map((point, index) =>
            `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
        )
        .join(' ')
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const areaPath =
        firstPoint && lastPoint
            ? `${linePath} L ${lastPoint.x} ${bottom} L ${firstPoint.x} ${bottom} Z`
            : ''

    return (
        <div className="weekly-overview-chart-shell">
            <svg
                aria-label="Biểu đồ doanh thu 7 ngày"
                className="weekly-overview-chart"
                role="img"
                viewBox={`0 0 ${width} ${height}`}
            >
                <defs>
                    <linearGradient
                        id="weekly-revenue-area"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="#f97316"
                            stopOpacity="0.28"
                        />
                        <stop
                            offset="100%"
                            stopColor="#f97316"
                            stopOpacity="0.03"
                        />
                    </linearGradient>
                </defs>

                {tickValues.map((tick) => {
                    const y = top + (1 - tick / maxTick) * plotHeight

                    return (
                        <g key={tick}>
                            <line
                                className="weekly-overview-chart-grid"
                                x1={left}
                                x2={width - right}
                                y1={y}
                                y2={y}
                            />
                            <text
                                className="weekly-overview-chart-axis-label"
                                textAnchor="end"
                                x={left - 14}
                                y={y + 4}
                            >
                                {formatRevenueAxis(tick)}
                            </text>
                        </g>
                    )
                })}

                {areaPath && (
                    <path
                        className="weekly-overview-chart-area"
                        d={areaPath}
                    />
                )}
                {linePath && (
                    <path
                        className="weekly-overview-chart-line"
                        d={linePath}
                    />
                )}

                {points.map((point) => (
                    <g key={point.date}>
                        <circle
                            className="weekly-overview-chart-point"
                            cx={point.x}
                            cy={point.y}
                            r="5"
                        />
                        <text
                            className="weekly-overview-chart-day-label"
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

function WeeklyComparisonCard({
    title,
    value,
    caption,
    tone,
    icon,
}: {
    title: string
    value: ReactNode
    caption?: ReactNode
    tone: 'green' | 'blue' | 'red'
    icon: ReactNode
}) {
    return (
        <article className={`weekly-comparison-card tone-${tone}`}>
            <span>{title}</span>
            <strong>{value}</strong>
            {caption && <small>{caption}</small>}
            <div className="weekly-comparison-card-icon">
                {icon}
            </div>
        </article>
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
    const revenue = data.revenue?.revenue ?? data.comparison?.currentRevenue ?? 0
    const comparison = data.comparison
    const revenueDifference = comparison?.difference ?? 0
    const comparisonTone = getToneClass(revenueDifference)
    const isRevenueDown = revenueDifference < 0
    const differenceVerb =
        revenueDifference > 0
            ? 'Tăng'
            : isRevenueDown
              ? 'Giảm'
              : 'Không đổi'
    const differenceCaption =
        revenueDifference === 0
            ? 'Không đổi so với tuần trước'
            : `${differenceVerb} ${formatRevenueCurrency(
                Math.abs(revenueDifference),
            )}`
    const bestSellers = data.bestSellers.slice(0, 5)
    const topDish = bestSellers[0]
    const maxQuantity = Math.max(
        1,
        ...bestSellers.map((item) => item.totalQuantity),
    )
    const shiftRows = buildShiftRows(data.orderShiftReport)
    const highestShift = shiftRows.find(
        (row) =>
            row.shiftName === data.orderShiftReport?.highestOrderShift?.shiftName,
    )
    const fallbackHighestShift = shiftRows.reduce(
        (bestShift, row) =>
            row.orderCount > bestShift.orderCount ? row : bestShift,
        shiftRows[0],
    )
    const featuredShift = highestShift ?? fallbackHighestShift
    const totalOrders =
        data.orderShiftReport?.totalPaidOrders
        ?? shiftRows.reduce((sum, row) => sum + row.orderCount, 0)
    const donutGradient = buildDonutGradient(shiftRows)
    const chartRows = buildWeeklyRevenueRows(
        selectedWeek,
        data.dailyRevenue,
    )

    return (
        <section
            aria-busy={isLoading}
            className="weekly-overview-dashboard"
        >
            <header className="weekly-overview-header">
                <div>
                    <h2>Dashboard tổng quan tuần</h2>
                    <p>
                        Tổng quan doanh thu, đơn hàng, món bán chạy và biến động
                        kinh doanh trong tuần.
                    </p>
                </div>

                <label className="weekly-overview-date-select">
                    <CalendarIcon />
                    <select
                        aria-label="Chọn khoảng thời gian"
                        disabled={isLoading}
                        value={selectedWeek.value}
                        onChange={(event) => onWeekChange(event.target.value)}
                    >
                        {weekOptions.map((week) => (
                            <option
                                key={week.value}
                                value={week.value}
                            >
                                {formatWeekRangeLabel(week)}
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon />
                </label>
            </header>

            {error && (
                <div className="weekly-overview-alert">
                    <span>{error}</span>
                    <button
                        disabled={isLoading}
                        type="button"
                        onClick={onReload}
                    >
                        Thử lại
                    </button>
                </div>
            )}

            <section className="weekly-overview-kpi-grid">
                <WeeklyOverviewKpiCard
                    icon={<MoneyIcon />}
                    marker="$"
                    title="Doanh thu tuần"
                    tone="orange"
                    value={formatRevenueCurrency(revenue)}
                />
                <WeeklyOverviewKpiCard
                    icon={<FileIcon />}
                    title="Đơn đã thanh toán"
                    tone="green"
                    value={`${formatNumber(totalOrders)} đơn`}
                />
                <WeeklyOverviewKpiCard
                    caption={differenceCaption}
                    icon={
                        <TrendStatusIcon
                            tone={isRevenueDown ? 'negative' : comparisonTone}
                        />
                    }
                    title="So với tuần trước"
                    tone={isRevenueDown ? 'red' : 'green'}
                    value={formatSignedPercentage(comparison?.growthRate)}
                />
                <WeeklyOverviewKpiCard
                    caption={`${formatNumber(topDish?.totalQuantity ?? 0)} phần`}
                    icon={<BowlIcon />}
                    title="Món bán chạy nhất"
                    tone="orange"
                    value={topDish?.dishName ?? 'Chưa có dữ liệu'}
                />
                <WeeklyOverviewKpiCard
                    caption={
                        <>
                            {formatNumber(featuredShift?.orderCount ?? 0)} đơn
                            {' · '}
                            {formatDecimal(featuredShift?.percentage ?? 0)}%
                        </>
                    }
                    featured
                    icon={<TrophyIcon />}
                    title="Ca nhiều đơn nhất"
                    tone="orange"
                    value={featuredShift?.displayName ?? 'Chưa có dữ liệu'}
                />
            </section>

            <section className="weekly-overview-main-grid">
                <article className="weekly-overview-panel weekly-revenue-chart-panel">
                    <h3>Doanh thu 7 ngày</h3>
                    <WeeklyRevenueLineChart rows={chartRows} />
                </article>

                <article className="weekly-overview-panel weekly-comparison-panel">
                    <h3>So sánh doanh thu</h3>
                    <div className="weekly-comparison-card-grid">
                        <WeeklyComparisonCard
                            icon={<TrendingIcon />}
                            title="Tuần trước"
                            tone="green"
                            value={formatRevenueCurrency(
                                comparison?.previousRevenue,
                            )}
                        />
                        <WeeklyComparisonCard
                            icon={<TrendingIcon />}
                            title="Tuần này"
                            tone="blue"
                            value={formatRevenueCurrency(revenue)}
                        />
                        <WeeklyComparisonCard
                            caption={getGrowthStatus(comparison?.growthRate)}
                            icon={
                                <TrendStatusIcon
                                    tone={
                                        isRevenueDown
                                            ? 'negative'
                                            : comparisonTone
                                    }
                                />
                            }
                            title="Chênh lệch"
                            tone={isRevenueDown ? 'red' : 'green'}
                            value={formatSignedRevenueCurrency(
                                revenueDifference,
                            )}
                        />
                    </div>
                </article>
            </section>

            <section className="weekly-overview-bottom-grid">
                <article className="weekly-overview-panel weekly-bestseller-panel">
                    <h3>Top món bán chạy</h3>

                    <div className="weekly-bestseller-list">
                        {bestSellers.length === 0 ? (
                            <div className="weekly-overview-empty">
                                Chưa có dữ liệu món bán chạy trong tuần này.
                            </div>
                        ) : (
                            bestSellers.map((item, index) => (
                                <div
                                    className="weekly-bestseller-row"
                                    key={`${item.rank}-${item.dishName}`}
                                >
                                    <span className="weekly-bestseller-rank">
                                        #{item.rank ?? index + 1}
                                    </span>
                                    <span className="weekly-bestseller-avatar">
                                        {getDishInitial(item.dishName)}
                                    </span>
                                    <div className="weekly-bestseller-info">
                                        <strong>{item.dishName}</strong>
                                        <div className="weekly-bestseller-track">
                                            <span
                                                style={{
                                                    width: `${Math.max(
                                                        8,
                                                        (item.totalQuantity
                                                            / maxQuantity)
                                                            * 100,
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <strong className="weekly-bestseller-count">
                                        {formatNumber(item.totalQuantity)}
                                    </strong>
                                </div>
                            ))
                        )}
                    </div>
                </article>

                <article className="weekly-overview-panel weekly-shift-panel">
                    <h3>Đơn hàng theo ca</h3>

                    <div className="weekly-shift-content">
                        <div
                            className="weekly-shift-donut"
                            style={{
                                background: `conic-gradient(from -90deg, ${donutGradient})`,
                            }}
                        >
                            <div className="weekly-shift-donut-hole">
                                <strong>{formatNumber(totalOrders)}</strong>
                                <span>đơn</span>
                            </div>
                        </div>

                        <div className="weekly-shift-legend">
                            {shiftRows.map((row) => (
                                <div
                                    className="weekly-shift-legend-item"
                                    key={row.shiftName}
                                >
                                    <span
                                        className="weekly-shift-dot"
                                        style={{
                                            background: row.color,
                                        }}
                                    />
                                    <div>
                                        <strong>{row.displayName}</strong>
                                        <span>
                                            {formatNumber(row.orderCount)} đơn
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            </section>
        </section>
    )
}

export default function AdminRevenueOverviewDashboard() {
    const [selectedWeek, setSelectedWeek] = useState<WeekOption>(() =>
        getDefaultWeek(new Date().getFullYear()),
    )
    const [overviewData, setOverviewData] =
        useState<WeeklyRevenueOverviewData>(
            emptyWeeklyRevenueOverviewData,
        )
    const [overviewError, setOverviewError] =
        useState<string | null>(null)
    const [isOverviewLoading, setIsOverviewLoading] = useState(false)
    const weekOptions = buildWeekOptions(new Date().getFullYear())

    useEffect(() => {
        void loadWeeklyRevenueOverview(selectedWeek)
    }, [])

    async function loadWeeklyRevenueOverview(
        week: WeekOption = selectedWeek,
    ) {
        const previousRange = getPreviousWeekRange(week)

        try {
            setIsOverviewLoading(true)
            setOverviewError(null)

            const [
                revenue,
                comparisonResult,
                dailyRevenue,
                bestSellingReport,
                orderShiftReport,
            ] = await Promise.all([
                adminApi.getCustomRevenue(
                    week.fromDate,
                    week.toDate,
                ),
                adminApi.compareRevenue(
                    previousRange.previousStartDate,
                    previousRange.previousEndDate,
                    week.fromDate,
                    week.toDate,
                ),
                adminApi.getDailyRevenue(week.fromDate, week.toDate),
                adminApi.getBestSellingReportBetween(
                    week.fromDate,
                    week.toDate,
                ),
                adminApi.getOrderShiftReportBetween(
                    week.fromDate,
                    week.toDate,
                ),
            ])

            setOverviewData({
                revenue: revenue.data,
                comparison: comparisonResult.data,
                dailyRevenue: dailyRevenue.data,
                bestSellers: bestSellingReport.data.items ?? [],
                orderShiftReport: orderShiftReport.data,
            })
        } catch (error) {
            console.error(error)
            setOverviewError(
                getApiErrorMessage(
                    error,
                    'Không thể tải dashboard tổng quan doanh thu tuần.',
                ),
            )
        } finally {
            setIsOverviewLoading(false)
        }
    }

    function handleWeekChange(weekValue: string) {
        const nextWeek = weekOptions.find(
            (week) => week.value === weekValue,
        )

        if (!nextWeek) {
            return
        }

        setSelectedWeek(nextWeek)
        void loadWeeklyRevenueOverview(nextWeek)
    }

    return (
        <WeeklyRevenueOverviewDashboard
            data={overviewData}
            error={overviewError}
            isLoading={isOverviewLoading}
            selectedWeek={selectedWeek}
            weekOptions={weekOptions}
            onReload={() => void loadWeeklyRevenueOverview(selectedWeek)}
            onWeekChange={handleWeekChange}
        />
    )
}
