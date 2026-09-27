import {PresetButtonGroup} from './RevenueDashboard'
import {
    formatNumber,
    formatRevenueCurrency,
    getDishInitial,
    resolveDishImageSrc,
} from './format'
import type {RangePreset, WeekOption} from './types'
import type {BestSellingDishItem, CategoryResponse} from '@/shared/api/admin'
import {useState} from 'react'

import {EmptyState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader} from '@/shared/components/ui'
export function BestSellerDishImage({
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
        <span className="rk-thumb">
            <img alt={dishName} src={imageSrc} onError={() => setHasError(true)} />
        </span>
    )
}

export function BestSellersReport({
    title = 'Món bán chạy',
    subtitle = 'Báo cáo món ăn bán chạy theo khoảng thời gian.',
    items,
    preset,
    selectedWeek,
    selectedYear,
    weekOptions,
    yearOptions,
    categories,
    selectedCategoryId,
    isLoading,
    error,
    onCategoryChange,
    onPresetChange,
    onWeekChange,
    onYearChange,
}: {
    title?: string
    subtitle?: string
    items: BestSellingDishItem[]
    preset: RangePreset
    selectedWeek: WeekOption
    selectedYear: number
    weekOptions: WeekOption[]
    yearOptions: number[]
    categories?: CategoryResponse[]
    selectedCategoryId?: string
    isLoading: boolean
    error: string | null
    onCategoryChange?: (categoryId: string) => void
    onPresetChange: (preset: RangePreset) => void
    onWeekChange: (weekValue: string) => void
    onYearChange: (year: number) => void
}) {
    const maxQuantity = Math.max(...items.map((item) => item.totalQuantity), 1)

    return (
        <PageCard>
            {/* PageHeader thay cho hàng ngang tự dựng: ở 375px hàng ngang ép
                tiêu đề còn ~40px và vỡ từng âm tiết ("THỐ / NG / KÊ"), còn cụm
                nút khoảng thời gian tràn ra ngoài màn. */}
            <PageHeader
                title={title}
                description={subtitle}
                actions={
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
                }
            />

            {categories && selectedCategoryId && onCategoryChange && (
                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="bestseller-category">
                        Danh mục
                    </label>

                    <select
                        id="bestseller-category"
                        className="rk-select"
                        disabled={isLoading || categories.length === 0}
                        value={selectedCategoryId}
                        onChange={(event) => onCategoryChange(event.target.value)}
                    >
                        {categories.length === 0 ? (
                            <option value="ALL">Chưa có danh mục</option>
                        ) : (
                            categories.map((category) => (
                                <option key={category.id} value={String(category.id)}>
                                    {category.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            )}

            {error && <p className="rk-note rk-note--alert">{error}</p>}

            {isLoading ? (
                <LoadingState
                    size="sm"
                    title="Đang tải món bán chạy..."
                    description="Hệ thống đang tổng hợp số liệu theo khoảng thời gian đã chọn."
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title="Chưa có dữ liệu món bán chạy"
                    description="Khoảng thời gian này chưa ghi nhận đơn nào."
                />
            ) : (
                <div className="rk-rowlist">
                    {items.map((item, index) => {
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
                                        {rank}
                                    </span>

                                    <BestSellerDishImage
                                        dishName={item.dishName}
                                        imageUrl={item.imageUrl}
                                    />

                                    <div className="rk-rowlist__main">
                                        <div className="rk-rowlist__title">
                                            {item.dishName}
                                        </div>

                                        <div className="rk-barrow">
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

                                            <p className="rk-rowlist__meta">
                                                {formatNumber(item.totalQuantity)} phần đã
                                                bán
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <span className="rk-tag">
                                    {formatRevenueCurrency(item.totalRevenue)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </PageCard>
    )
}
