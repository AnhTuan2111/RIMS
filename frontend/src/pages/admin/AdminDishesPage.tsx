import { formatCurrency, mockDishes } from '../../data/mockData'

export default function AdminDishesPage() {
    return (
        <div className="page-card">
            <div className="page-header">
                <div>
                    <h2>Quản lý món ăn</h2>
                    <p>Admin có thể thêm, sửa, ẩn hoặc cập nhật giá món ăn.</p>
                </div>

                <button className="primary-button">Thêm món</button>
            </div>

            <div className="simple-table">
                <div className="simple-table-header">
                    <span>Tên món</span>
                    <span>Danh mục</span>
                    <span>Giá</span>
                    <span>Trạng thái</span>
                </div>

                {mockDishes.map((dish) => (
                    <div className="simple-table-row" key={dish.id}>
                        <span>{dish.name}</span>
                        <span>{dish.category}</span>
                        <span>{formatCurrency(dish.price)}</span>
                        <span>{dish.available ? 'Đang bán' : 'Tạm ẩn'}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}