export default function WaiterCreateOrderPage() {
    return (
        <div className="page-card">
            <h2>Tạo order</h2>
            <p>Phục vụ chọn bàn, chọn món và gửi order xuống bếp.</p>

            <form className="simple-form">
                <label>
                    Chọn bàn
                    <select>
                        <option>T01</option>
                        <option>T02</option>
                        <option>T03</option>
                    </select>
                </label>

                <label>
                    Chọn món
                    <select>
                        <option>Fried Rice</option>
                        <option>Pho Bo</option>
                        <option>Bun Cha</option>
                    </select>
                </label>

                <label>
                    Ghi chú
                    <input placeholder="Ví dụ: ít cay, không hành..." />
                </label>

                <button type="button" className="primary-button">
                    Tạo order
                </button>
            </form>
        </div>
    )
}