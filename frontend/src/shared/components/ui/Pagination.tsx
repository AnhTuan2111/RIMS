import {ChevronLeft, ChevronRight} from 'lucide-react'

interface PaginationProps {
    /** Trang hiện tại, đếm từ 1. */
    page: number
    totalPages: number
    /** Tổng số bản ghi. Không truyền thì không hiện dòng "Hiển thị x–y". */
    totalItems?: number
    /** Số bản ghi mỗi trang. Truyền kèm onPageSizeChange để hiện ô chọn. */
    pageSize?: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (size: number) => void
}

const PAGE_SIZES = [5, 10, 20, 50]

/**
 * Phân trang dùng chung cho mọi màn.
 *
 * <p>Trước đây có 8 bản dựng riêng, nhãn nút viết 8 kiểu khác nhau ("Trang sau →",
 * "← Trang trước", "Trước", "Sau", "Sau →"...), và bản trong admin/users dùng
 * màu tím #4f46e5 không thuộc bảng màu nào của dự án.
 *
 * <p>Nút lùi/tiến chỉ dùng icon và có nhãn cho trình đọc màn hình, nên không còn
 * chuyện mỗi trang viết chữ một kiểu.
 */
export function Pagination({
    page,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: PaginationProps) {
    if (totalPages <= 1 && !onPageSizeChange) {
        return null
    }

    // 1 … 4 5 [6] 7 8 … 20
    const pages: (number | 'gap')[] = []
    const left = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)

    pages.push(1)
    if (left > 2) pages.push('gap')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('gap')
    if (totalPages > 1) pages.push(totalPages)

    const from = pageSize ? (page - 1) * pageSize + 1 : 0
    const to = pageSize && totalItems ? Math.min(page * pageSize, totalItems) : 0

    return (
        <nav className="rk-pager" aria-label="Phân trang">
            <div className="rk-pager__info">
                {totalItems != null && pageSize != null && totalItems > 0 && (
                    <span>
                        Hiển thị <strong className="rk-num">{from}</strong>–
                        <strong className="rk-num">{to}</strong> trong{' '}
                        <strong className="rk-num">{totalItems}</strong>
                    </span>
                )}

                {onPageSizeChange && pageSize != null && (
                    <select
                        className="rk-select rk-pager__size"
                        value={pageSize}
                        aria-label="Số dòng mỗi trang"
                        onChange={(event) => onPageSizeChange(Number(event.target.value))}
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size} / trang
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {totalPages > 1 && (
                <div className="rk-pager__pages">
                    <button
                        type="button"
                        className="rk-pager__btn"
                        disabled={page <= 1}
                        aria-label="Trang trước"
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft className="rk-icon" aria-hidden="true" />
                    </button>

                    {pages.map((entry, index) =>
                        entry === 'gap' ? (
                            <span className="rk-pager__gap" key={`gap-${index}`}>
                                …
                            </span>
                        ) : (
                            <button
                                type="button"
                                key={entry}
                                className={`rk-pager__btn rk-num${
                                    entry === page ? ' rk-pager__btn--current' : ''
                                }`}
                                aria-current={entry === page ? 'page' : undefined}
                                onClick={() => onPageChange(entry)}
                            >
                                {entry}
                            </button>
                        ),
                    )}

                    <button
                        type="button"
                        className="rk-pager__btn"
                        disabled={page >= totalPages}
                        aria-label="Trang sau"
                        onClick={() => onPageChange(page + 1)}
                    >
                        <ChevronRight className="rk-icon" aria-hidden="true" />
                    </button>
                </div>
            )}
        </nav>
    )
}
