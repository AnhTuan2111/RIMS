import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react'
import {
    formatDateForApi,
    formatDisplayDate,
    formatManualDateInput,
    getCalendarDays,
    getCalendarMonthDate,
    getCalendarYearOptions,
    isSameCalendarDate,
    parseVietnameseDate,
    vietnameseMonthLabels,
    vietnameseWeekdayLabels,
} from './dateUtils'
import {formatRevenueCurrency} from './format'
import type {RangePreset, RevenueDashboardData, WeekOption} from './types'
import {useEffect, useRef, useState, type KeyboardEvent} from 'react'

import {PageCard, PageHeader} from '@/shared/components/ui'
export function RevenueCard({
    title,
    amount,
    className = '',
}: {
    title: string
    amount?: number | null
    className?: string
}) {
    // Bỏ icon "đ" ở góc thẻ: ký hiệu đơn vị đã nằm trong chính con số, để hai
    // chỗ là thừa. Giá trị dùng chữ số đều bề ngang và không xuống dòng —
    // trước đây "1.829.000 đ" bị vỡ làm hai dòng, chữ đ rơi xuống dưới.
    return (
        <article className={`rk-stat ${className}`.trim()}>
            <span className="rk-stat__label">{title}</span>
            <strong className="rk-stat__value">{formatRevenueCurrency(amount)}</strong>
        </article>
    )
}

export function RevenueDateInput({
    id,
    label,
    value,
    onChange,
}: {
    id: string
    label: string
    value: string
    onChange: (value: string) => void
}) {
    const fieldRef = useRef<HTMLDivElement | null>(null)
    const selectedDate = parseVietnameseDate(value)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [calendarDate, setCalendarDate] = useState(() =>
        getCalendarMonthDate(selectedDate ?? new Date()),
    )
    const calendarDays = getCalendarDays(calendarDate)
    const calendarYearOptions = getCalendarYearOptions(calendarDate.getFullYear())

    useEffect(() => {
        if (!isCalendarOpen) {
            return undefined
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (fieldRef.current?.contains(event.target as Node)) {
                return
            }

            setIsCalendarOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)

        return () => document.removeEventListener('mousedown', handlePointerDown)
    }, [isCalendarOpen])

    function openCalendar() {
        const parsedDate = parseVietnameseDate(value)

        if (parsedDate) {
            setCalendarDate(getCalendarMonthDate(parsedDate))
        }

        setIsCalendarOpen(true)
    }

    function handleManualChange(inputValue: string) {
        const formattedValue = formatManualDateInput(inputValue)
        const parsedDate = parseVietnameseDate(formattedValue)

        onChange(formattedValue)

        if (parsedDate) {
            setCalendarDate(getCalendarMonthDate(parsedDate))
        }
    }

    function handleDateSelect(date: Date) {
        onChange(formatDisplayDate(formatDateForApi(date)))
        setCalendarDate(getCalendarMonthDate(date))
        setIsCalendarOpen(false)
    }

    function handleMonthChange(month: number) {
        setCalendarDate((currentDate) => new Date(currentDate.getFullYear(), month, 1))
    }

    function handleYearChange(year: number) {
        setCalendarDate((currentDate) => new Date(year, currentDate.getMonth(), 1))
    }

    function handleCalendarKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            setIsCalendarOpen(false)
        }
    }

    return (
        <div className="rk-datefield" ref={fieldRef}>
            <label htmlFor={id}>{label}</label>

            <span className="rk-datefield__shell">
                <input
                    aria-label={`${label} dạng ngày/tháng/năm`}
                    className="rk-input"
                    id={id}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="dd/mm/yyyy"
                    type="text"
                    value={value}
                    onChange={(event) => handleManualChange(event.target.value)}
                    onFocus={openCalendar}
                    onKeyDown={handleCalendarKeyDown}
                />

                <button
                    aria-label={`Mở lịch ${label}`}
                    className="rk-datefield__trigger"
                    type="button"
                    onClick={openCalendar}
                >
                    <CalendarDays className="rk-icon" aria-hidden="true" />
                </button>
            </span>

            {isCalendarOpen && (
                <div
                    aria-label={`Lịch chọn ${label}`}
                    className="rk-calendar"
                    role="dialog"
                    onKeyDown={handleCalendarKeyDown}
                >
                    <div className="rk-calendar__nav">
                        <button
                            aria-label="Chuyển đến tháng trước"
                            className="rk-calendar__navbtn"
                            type="button"
                            onClick={() =>
                                setCalendarDate(
                                    (currentDate) =>
                                        new Date(
                                            currentDate.getFullYear(),
                                            currentDate.getMonth() - 1,
                                            1,
                                        ),
                                )
                            }
                        >
                            <ChevronLeft className="rk-icon" aria-hidden="true" />
                        </button>

                        <div className="rk-calendar__title">
                            <select
                                aria-label="Chọn tháng"
                                value={calendarDate.getMonth()}
                                onChange={(event) =>
                                    handleMonthChange(Number(event.target.value))
                                }
                            >
                                {vietnameseMonthLabels.map((monthLabel, monthIndex) => (
                                    <option key={monthLabel} value={monthIndex}>
                                        {monthLabel}
                                    </option>
                                ))}
                            </select>

                            <span>năm</span>

                            <select
                                aria-label="Chọn năm"
                                value={calendarDate.getFullYear()}
                                onChange={(event) =>
                                    handleYearChange(Number(event.target.value))
                                }
                            >
                                {calendarYearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            aria-label="Chuyển đến tháng tiếp theo"
                            className="rk-calendar__navbtn"
                            type="button"
                            onClick={() =>
                                setCalendarDate(
                                    (currentDate) =>
                                        new Date(
                                            currentDate.getFullYear(),
                                            currentDate.getMonth() + 1,
                                            1,
                                        ),
                                )
                            }
                        >
                            <ChevronRight className="rk-icon" aria-hidden="true" />
                        </button>
                    </div>

                    <div aria-hidden="true" className="rk-calendar__weekdays">
                        {vietnameseWeekdayLabels.map((weekdayLabel) => (
                            <span key={weekdayLabel}>{weekdayLabel}</span>
                        ))}
                    </div>

                    <div className="rk-calendar__grid">
                        {calendarDays.map((date) => {
                            const dateValue = formatDateForApi(date)
                            const displayDate = formatDisplayDate(dateValue)
                            const isCurrentMonth =
                                date.getFullYear() === calendarDate.getFullYear() &&
                                date.getMonth() === calendarDate.getMonth()
                            const isSelected =
                                selectedDate && isSameCalendarDate(date, selectedDate)
                            const isToday = isSameCalendarDate(date, new Date())
                            const className = [
                                'rk-calendar__day',
                                isCurrentMonth ? '' : 'is-outside',
                                isSelected ? 'is-selected' : '',
                                isToday ? 'is-today' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')

                            return (
                                <button
                                    aria-label={`Chọn ngày ${displayDate}`}
                                    className={className}
                                    key={dateValue}
                                    type="button"
                                    onClick={() => handleDateSelect(date)}
                                >
                                    {date.getDate()}
                                </button>
                            )
                        })}
                    </div>

                    <div className="rk-calendar__foot">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('')
                                setIsCalendarOpen(false)
                            }}
                        >
                            Xóa
                        </button>

                        <button
                            type="button"
                            onClick={() => handleDateSelect(new Date())}
                        >
                            Hôm nay
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export function PresetButtonGroup({
    activePreset,
    selectedWeek,
    selectedYear,
    weekOptions,
    yearOptions,
    isLoading,
    onChange,
    onWeekChange,
    onYearChange,
}: {
    activePreset: RangePreset
    selectedWeek: WeekOption
    selectedYear: number
    weekOptions: WeekOption[]
    yearOptions: number[]
    isLoading: boolean
    onChange: (preset: RangePreset) => void
    onWeekChange: (weekValue: string) => void
    onYearChange: (year: number) => void
}) {
    return (
        <div className={activePreset === 'CUSTOM_WEEK' ? 'rk-stack' : 'rk-stack'}>
            <div className="rk-segment">
                <button
                    className={
                        activePreset === 'TODAY'
                            ? 'rk-segment__btn is-active'
                            : 'rk-segment__btn'
                    }
                    disabled={isLoading}
                    type="button"
                    onClick={() => onChange('TODAY')}
                >
                    Hôm nay
                </button>
                <button
                    className={
                        activePreset === 'LAST_7'
                            ? 'rk-segment__btn is-active'
                            : 'rk-segment__btn'
                    }
                    disabled={isLoading}
                    type="button"
                    onClick={() => onChange('LAST_7')}
                >
                    7 ngày gần nhất
                </button>
                <button
                    className={
                        activePreset === 'CUSTOM_WEEK'
                            ? 'rk-segment__btn is-active'
                            : 'rk-segment__btn'
                    }
                    disabled={isLoading}
                    type="button"
                    onClick={() => onChange('CUSTOM_WEEK')}
                >
                    Tùy chọn
                </button>
            </div>

            {activePreset === 'CUSTOM_WEEK' && (
                <div className="rk-formgrid">
                    <label>
                        <span>Năm</span>
                        <select
                            disabled={isLoading}
                            value={selectedYear}
                            onChange={(event) => onYearChange(Number(event.target.value))}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Tuần</span>
                        <select
                            disabled={isLoading}
                            value={selectedWeek.value}
                            onChange={(event) => onWeekChange(event.target.value)}
                        >
                            {weekOptions.map((week) => (
                                <option key={week.value} value={week.value}>
                                    {week.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </div>
    )
}

export function RevenueDashboard({
    data,
    fromDate,
    toDate,
    isLoading,
    isCustomLoading,
    error,
    customRangeError,
    onFromDateChange,
    onToDateChange,
    onReload,
    onApplyCustomRange,
}: {
    data: RevenueDashboardData
    fromDate: string
    toDate: string
    isLoading: boolean
    isCustomLoading: boolean
    error: string | null
    customRangeError: string | null
    onFromDateChange: (value: string) => void
    onToDateChange: (value: string) => void
    onReload: () => void
    onApplyCustomRange: () => void
}) {
    return (
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    eyebrow="Thống kê"
                    title="Báo cáo tổng doanh thu"
                    description="Tổng quan doanh thu hiện tại."
                />

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

            <div aria-busy={isLoading} className="rk-statrow">
                <RevenueCard amount={data.totalRevenue?.revenue} title="Tổng doanh thu" />
                <RevenueCard
                    amount={data.todayRevenue?.revenue}
                    title="Doanh thu hôm nay"
                />
                <RevenueCard
                    amount={data.weeklyRevenue?.revenue}
                    title="Doanh thu tuần"
                />
                <RevenueCard
                    amount={data.monthlyRevenue?.revenue}
                    title="Doanh thu tháng"
                />
                <RevenueCard amount={data.yearlyRevenue?.revenue} title="Doanh thu năm" />
            </div>

            <PageCard>
                <h3 className="rk-sectiontitle">Khoảng ngày tùy chọn</h3>

                <form
                    className="rk-stack"
                    onSubmit={(event) => {
                        event.preventDefault()
                        onApplyCustomRange()
                    }}
                >
                    <div className="rk-filterbar">
                        <RevenueDateInput
                            id="admin-revenue-from-date"
                            label="Từ ngày"
                            value={fromDate}
                            onChange={onFromDateChange}
                        />

                        <RevenueDateInput
                            id="admin-revenue-to-date"
                            label="Đến ngày"
                            value={toDate}
                            onChange={onToDateChange}
                        />

                        <button
                            type="submit"
                            className="rk-btn rk-btn--primary"
                            disabled={isCustomLoading}
                        >
                            {isCustomLoading ? 'Đang áp dụng…' : 'Áp dụng'}
                        </button>
                    </div>

                    {customRangeError && (
                        <p className="rk-formerror">{customRangeError}</p>
                    )}

                    <RevenueCard
                        amount={data.customRangeRevenue?.revenue}
                        title="Doanh thu khoảng ngày"
                    />
                </form>
            </PageCard>
        </div>
    )
}
