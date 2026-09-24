import {FileText, TrendingUp, Trophy} from 'lucide-react'
import {PresetButtonGroup} from './RevenueDashboard'
import {LoadingState} from '@/shared/components/feedback'
import {PageCard, StatCard} from '@/shared/components/ui'
import {getOrderShiftRangeLabel} from './dateUtils'
import {buildDonutGradient, buildShiftRows, formatDecimal, formatNumber} from './format'
import type {RangePreset, WeekOption} from './types'
import type {OrderShiftReportResponse} from '@/shared/api/admin'
export function OrderShiftDashboard({
    report,
    preset,
    selectedWeek,
    selectedYear,
    weekOptions,
    yearOptions,
    isLoading,
    error,
    onPresetChange,
    onWeekChange,
    onYearChange,
}: {
    report: OrderShiftReportResponse | null
    preset: RangePreset
    selectedWeek: WeekOption
    selectedYear: number
    weekOptions: WeekOption[]
    yearOptions: number[]
    isLoading: boolean
    error: string | null
    onPresetChange: (preset: RangePreset) => void
    onWeekChange: (weekValue: string) => void
    onYearChange: (year: number) => void
}) {
    const rows = buildShiftRows(report)
    const donutGradient = buildDonutGradient(rows)
    const totalOrders = report?.totalPaidOrders ?? 0
    const averageOrdersPerDay = report?.averageOrdersPerDay ?? 0
    const highestShift = rows.find(
        (row) => row.shiftName === report?.highestOrderShift?.shiftName,
    )

    return (
        <div className="rk-stack">
            <PageCard>
                <div className="rk-card__head-inline">
                    <div>
                        <h2 className="rk-sectiontitle">Thống kê đơn hàng theo ca</h2>
                        <p className="rk-pagehead__desc">
                            Báo cáo đơn hàng đã thanh toán theo từng ca.
                        </p>
                    </div>

                    <PresetButtonGroup
                        activePreset={preset}
                        isLoading={isLoading}
                        selectedWeek={selectedWeek}
                        selectedYear={selectedYear}
                        weekOptions={weekOptions}
                        yearOptions={yearOptions}
                        onChange={onPresetChange}
                        onWeekChange={onWeekChange}
                        onYearChange={onYearChange}
                    />
                </div>

                {error && <p className="rk-note rk-note--alert">{error}</p>}
            </PageCard>

            <div className="rk-statgrid">
                <StatCard
                    label="Tổng đơn đã thanh toán"
                    value={`${formatNumber(totalOrders)} đơn`}
                    textValue
                    icon={<FileText className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Ca có nhiều đơn nhất"
                    value={highestShift?.displayName ?? 'Chưa có dữ liệu'}
                    textValue
                    tone="brand"
                    icon={<Trophy className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Trung bình mỗi ngày"
                    value={`${formatDecimal(averageOrdersPerDay)} đơn`}
                    textValue
                    icon={<TrendingUp className="rk-icon" aria-hidden="true" />}
                />
            </div>

            {isLoading ? (
                <LoadingState
                    size="sm"
                    title="Đang tải đơn hàng theo ca…"
                    description="Hệ thống đang tổng hợp số liệu theo khoảng thời gian đã chọn."
                />
            ) : (
                <div className="rk-two rk-two--wideleft">
                    <PageCard>
                        <h3 className="rk-sectiontitle">Chi tiết theo ca</h3>

                        <div className="rk-tablewrap">
                            <table className="rk-table rk-table--compact">
                                <thead>
                                    <tr>
                                        <th scope="col">Ca</th>
                                        <th scope="col">Thời gian</th>
                                        <th scope="col" className="rk-th--num">
                                            Số đơn
                                        </th>
                                        <th scope="col" className="rk-th--num">
                                            Tỷ trọng
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row) => (
                                        <tr
                                            key={row.shiftName}
                                            className={
                                                row.shiftName === highestShift?.shiftName
                                                    ? 'is-highlighted'
                                                    : undefined
                                            }
                                        >
                                            <td>
                                                <strong>{row.displayName}</strong>
                                            </td>

                                            <td>
                                                {row.startTime}–{row.endTime}
                                            </td>

                                            <td className="rk-td--num">
                                                {formatNumber(row.orderCount)}
                                            </td>

                                            <td className="rk-td--num">
                                                {formatDecimal(row.percentage)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                <tfoot>
                                    <tr>
                                        <td>
                                            <strong>Tổng</strong>
                                        </td>

                                        <td>
                                            {getOrderShiftRangeLabel(
                                                report,
                                                preset,
                                                selectedWeek,
                                            )}
                                        </td>

                                        <td className="rk-td--num">
                                            <strong>{formatNumber(totalOrders)}</strong>
                                        </td>

                                        <td className="rk-td--num">
                                            <strong>
                                                {totalOrders > 0 ? '100%' : '0%'}
                                            </strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </PageCard>

                    <PageCard>
                        <h3 className="rk-sectiontitle">Tỷ trọng đơn theo ca</h3>

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
                                {rows.map((row) => (
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
                                                {formatDecimal(row.percentage)}% ·{' '}
                                                {formatNumber(row.orderCount)} đơn
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </PageCard>
                </div>
            )}
        </div>
    )
}
