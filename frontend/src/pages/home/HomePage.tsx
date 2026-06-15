import { Link } from 'react-router-dom'

export default function HomePage() {
    return (
        <main className="restaurant-home">
            <header className="restaurant-navbar">
                <div className="restaurant-brand">
                    <div className="restaurant-logo-mark">R</div>

                    <div>
                        <h1>RIMS</h1>
                        <p>Restaurant Management System</p>
                    </div>
                </div>

                <nav className="restaurant-nav">
                    <a href="#home">HOME</a>
                    <a href="#about">VỀ CHÚNG TÔI</a>
                    <a href="#roles">VAI TRÒ</a>
                    <a href="#features">TÍNH NĂNG</a>
                    <a href="#contact">LIÊN HỆ</a>

                    <Link className="restaurant-login-btn" to="/login">
                        Đăng nhập
                    </Link>
                </nav>
            </header>

            <section id="home" className="restaurant-hero">
                <div className="restaurant-hero-overlay"></div>

                <div className="restaurant-hero-content">
                    <p className="restaurant-subtitle">Premium Restaurant Operation</p>

                    <h2>
                        RIMS
                        <span>Smart Restaurant Management</span>
                    </h2>

                    <p className="restaurant-description">
                        Hệ thống quản lý nhà hàng hiện đại, hỗ trợ Admin, Chef,
                        Waiter và Cashier vận hành mượt mà từ order đến thanh toán.
                    </p>

                    <div className="restaurant-hero-actions">
                        <Link className="restaurant-primary-btn" to="/login">
                            Đăng nhập hệ thống
                        </Link>

                        <a className="restaurant-secondary-btn" href="#features">
                            Khám phá thêm
                        </a>
                    </div>
                </div>
            </section>

            <section id="about" className="restaurant-section restaurant-about">
                <div>
                    <p className="restaurant-section-label">About RIMS</p>
                    <h2>Quản lý nhà hàng rõ ràng, nhanh chóng và chuyên nghiệp</h2>
                </div>

                <p>
                    RIMS giúp kết nối các bộ phận trong nhà hàng: phục vụ tạo order,
                    bếp nhận món cần chế biến, thu ngân xử lý thanh toán và admin quản lý hệ thống.
                    Tất cả được gom trong một giao diện trực quan, dễ sử dụng.
                </p>
            </section>

            <section id="roles" className="restaurant-section">
                <div className="restaurant-section-header">
                    <p className="restaurant-section-label">User Roles</p>
                    <h2>Thiết kế riêng cho từng vai trò</h2>
                </div>

                <div className="restaurant-role-grid">
                    <article>
                        <span>01</span>
                        <h3>Admin</h3>
                        <p>Quản lý nhân viên, bàn, món ăn và cấu hình hệ thống.</p>
                    </article>

                    <article>
                        <span>02</span>
                        <h3>Chef</h3>
                        <p>Xem món cần chế biến, xem chi tiết món và cập nhật hoàn thành.</p>
                    </article>

                    <article>
                        <span>03</span>
                        <h3>Waiter</h3>
                        <p>Quản lý bàn, tạo order và gửi yêu cầu xuống bếp.</p>
                    </article>

                    <article>
                        <span>04</span>
                        <h3>Cashier</h3>
                        <p>Xử lý hóa đơn, thanh toán và giao dịch.</p>
                    </article>
                </div>
            </section>

            <section id="features" className="restaurant-feature-section">
                <div className="restaurant-feature-content">
                    <p className="restaurant-section-label">Core Features</p>

                    <h2>Tối ưu toàn bộ quy trình phục vụ</h2>

                    <div className="restaurant-feature-list">
                        <div>
                            <strong>Order Management</strong>
                            <p>Theo dõi order theo bàn và trạng thái món ăn.</p>
                        </div>

                        <div>
                            <strong>Kitchen Queue</strong>
                            <p>Bếp xem món cần chế biến và cập nhật khi hoàn thành.</p>
                        </div>

                        <div>
                            <strong>Payment Flow</strong>
                            <p>Thu ngân kiểm tra hóa đơn và xử lý thanh toán nhanh.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="contact" className="restaurant-cta">
                <p className="restaurant-section-label">Get Started</p>
                <h2>Sẵn sàng vận hành nhà hàng hiệu quả hơn?</h2>
                <p>Đăng nhập để bắt đầu sử dụng hệ thống RIMS.</p>

                <Link className="restaurant-primary-btn" to="/login">
                    Login Now
                </Link>
            </section>

            <footer className="restaurant-footer">
                <p>© 2026 RIMS. Restaurant Management System.</p>
            </footer>
        </main>
    )
}