import {useId, useState, type ReactNode} from 'react'

/**
 * Một cột của bảng trạng thái.
 *
 * `tone` quyết định màu ô số đếm, và nó phải khớp NGHĨA của trạng thái chứ
 * không phải vị trí cột: LÀM lục, CHỜ hổ phách, BỎ đỏ, TIN xanh.
 */
export type BoardColumn<T> = {
    /** Khoá ổn định — dùng cho tab đang chọn, không dùng chỉ số mảng. */
    key: string
    label: string
    tone: 'ok' | 'busy' | 'alert' | 'info' | 'idle'
    items: T[]
    /** Câu hiện khi cột rỗng. Cột rỗng vẫn giữ chỗ, không biến mất. */
    empty: string
}

type StatusBoardProps<T> = {
    columns: BoardColumn<T>[]
    renderItem: (item: T, columnKey: string) => ReactNode
    /** Khoá React cho từng phiếu. */
    itemKey: (item: T) => string | number
    /** Nhãn cho trình đọc màn hình. */
    label: string
}

/**
 * Bảng ba cột theo trạng thái.
 *
 * <p>CHỈ dùng cho màn có DÒNG TRẠNG THÁI THẬT. Kanban chia theo trạng thái, nên
 * nó vô nghĩa ở màn mà các dòng không có trạng thái để chia — màn Gom món chia
 * theo MÓN, màn Hoá đơn là lịch sử. Hai màn đó giữ khung của chúng.
 *
 * <p>Dưới 52rem ba cột cạnh nhau còn khoảng 100px mỗi cột, không đọc được. Khi
 * đó chỉ một cột hiện và ba nút tab chuyển cột. Tab vẫn mang số đếm, nên thứ
 * quý nhất của kanban — biết đang nghẽn ở đâu — không mất ở khung hẹp.
 *
 * <p>Trên 52rem cả ba cột đều hiện, và thuộc tính `hidden` bị CSS vô hiệu hoá
 * thay vì gỡ khỏi DOM: đổi cỡ cửa sổ không làm mất cột nào.
 */
export function StatusBoard<T>({columns, renderItem, itemKey, label}: StatusBoardProps<T>) {
    const [active, setActive] = useState(columns[0]?.key ?? '')
    const id = useId()

    // Cột đang chọn có thể biến mất nếu nguồn dữ liệu đổi. Quay về cột đầu
    // thay vì hiện một bảng không có cột nào.
    const current = columns.some((c) => c.key === active) ? active : (columns[0]?.key ?? '')

    return (
        <div className="rk-board" role="group" aria-label={label}>
            <div className="rk-board__tabs" role="tablist" aria-label={label}>
                {columns.map((column) => (
                    <button
                        key={column.key}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${column.key}`}
                        aria-selected={column.key === current}
                        aria-controls={`${id}-col-${column.key}`}
                        className="rk-board__tab"
                        onClick={() => setActive(column.key)}
                    >
                        {column.label}
                        <span className="rk-board__tabcount">{column.items.length}</span>
                    </button>
                ))}
            </div>

            {columns.map((column) => (
                <section
                    key={column.key}
                    id={`${id}-col-${column.key}`}
                    className={`rk-board__col rk-board__col--${column.tone}`}
                    hidden={column.key !== current}
                    aria-labelledby={`${id}-head-${column.key}`}
                >
                    <h2 className="rk-board__head" id={`${id}-head-${column.key}`}>
                        {column.label}
                        <span className="rk-board__count">{column.items.length}</span>
                    </h2>

                    {column.items.length === 0 ? (
                        <p className="rk-board__empty">{column.empty}</p>
                    ) : (
                        <div className="rk-board__body">
                            {column.items.map((item) => (
                                <div key={itemKey(item)}>{renderItem(item, column.key)}</div>
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </div>
    )
}
