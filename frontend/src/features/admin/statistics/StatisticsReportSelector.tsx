import {formatRevenueCurrency} from './format'
import type {ReportKey} from './types'

interface ReportTab {
    key: ReportKey
    label: string
    /** Giá trị hiện ngay dưới nhãn, để admin liếc là thấy, khỏi mở từng báo cáo. */
    value?: string
    /** true khi giá trị là chữ (tên ca) chứ không phải số — dùng font chữ. */
    isText?: boolean
}

/**
 * Chọn báo cáo để xem.
 *
 * <p>Trước đây bốn nút này mang bốn ô màu xanh lá / xanh dương / tím / cam với
 * chữ "VND", "DM", "Top", "Ca" — bốn màu không mang ý nghĩa gì, chỉ để trang
 * trí. Bỏ hết: nhãn và con số tự nói lên nội dung, và cả hàng giờ dùng đúng
 * một màu nhấn cho tab đang mở.
 */
export function StatisticsReportSelector({
    activeReport,
    totalRevenue,
    bestSellerCount,
    highestShiftName,
    onSelectReport,
}: {
    activeReport: ReportKey
    totalRevenue?: number | null
    bestSellerCount: number
    highestShiftName?: string | null
    onSelectReport: (report: ReportKey) => void
}) {
    const tabs: ReportTab[] = [
        {
            key: 'revenue',
            label: 'Tổng doanh thu',
            value: formatRevenueCurrency(totalRevenue),
        },
        {
            key: 'categoryBestsellers',
            label: 'Bán chạy theo danh mục',
        },
        {
            key: 'bestsellers',
            label: 'Món bán chạy',
            value: bestSellerCount > 0 ? `${bestSellerCount} món` : '—',
        },
        {
            key: 'orderShifts',
            label: 'Đơn hàng theo ca',
            value: highestShiftName ?? '—',
            isText: true,
        },
    ]

    return (
        <section className="rk-statrow" aria-label="Chọn báo cáo">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    className={`rk-stat rk-stat--tab${
                        activeReport === tab.key ? ' rk-stat--active' : ''
                    }`}
                    aria-pressed={activeReport === tab.key}
                    onClick={() => onSelectReport(tab.key)}
                >
                    <span className="rk-stat__label">{tab.label}</span>

                    {tab.value && (
                        <span
                            className={`rk-stat__value${
                                tab.isText ? ' rk-stat__value--text' : ''
                            }`}
                        >
                            {tab.value}
                        </span>
                    )}
                </button>
            ))}
        </section>
    )
}
