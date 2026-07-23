import {Link} from 'react-router-dom'

export default function HomePage() {
    return (
        <main className="restaurant-home">
            <header className="restaurant-navbar">
                <div className="restaurant-brand">
                    <div className="restaurant-logo-mark">日</div>

                    <div>
                        <h1>NIHON BITES</h1>
                        <p>日本の味 · Ẩm thực Nhật Bản chính thống</p>
                    </div>
                </div>

                <nav className="restaurant-nav">
                    <a href="#home">TRANG CHỦ</a>
                    <a href="#about">VỀ CHÚNG TÔI</a>
                    <a href="#roles">ĐẶC SẢN</a>
                    <a href="#features">TRẢI NGHIỆM</a>
                    <a href="#contact">LIÊN HỆ</a>

                    <Link className="restaurant-login-btn" to="/login">
                        Đăng nhập
                    </Link>
                </nav>
            </header>

            <section id="home" className="restaurant-hero">
                <div className="restaurant-hero-overlay"></div>

                <div className="restaurant-hero-content">
                    <p className="restaurant-subtitle">Ẩm thực Nhật Bản chính thống</p>

                    <h2>
                        NIHON BITES
                        <span>Hương vị Nhật Bản đích thực giữa lòng thành phố</span>
                    </h2>

                    <p className="restaurant-description">
                        Từ sushi tươi ngon, ramen đậm đà đến wagyu thượng hạng —
                        Nihon Bites mang đến trải nghiệm ẩm thực Nhật Bản tinh tế,
                        được chế biến bởi đầu bếp giàu kinh nghiệm với nguyên liệu
                        nhập khẩu tuyển chọn.
                    </p>

                    <div className="restaurant-hero-actions">
                        <Link className="restaurant-primary-btn" to="/login">
                            Đặt bàn ngay
                        </Link>

                        <a className="restaurant-secondary-btn" href="#roles">
                            Khám phá thực đơn
                        </a>
                    </div>
                </div>
            </section>

            <section id="about" className="restaurant-section restaurant-about">
                <div>
                    <p className="restaurant-section-label">Về Nihon Bites</p>
                    <h2>Nơi tinh hoa ẩm thực Nhật Bản hội tụ</h2>
                </div>

                <p>
                    Nihon Bites ra đời với mong muốn mang trọn vẹn tinh thần
                    "omotenashi" — sự hiếu khách chân thành của người Nhật —
                    đến từng thực khách. Không gian ấm cúng, đầu bếp tận tâm và
                    nguyên liệu tươi ngon mỗi ngày là những gì chúng tôi tự hào
                    mang đến cho bạn trong mỗi bữa ăn.
                </p>
            </section>

            <section id="roles" className="restaurant-section">
                <div className="restaurant-section-header">
                    <p className="restaurant-section-label">Đặc sản nổi bật</p>
                    <h2>Thực đơn được yêu thích nhất</h2>
                </div>

                <div className="restaurant-role-grid">
                    <article>
                        <span>01</span>
                        <h3>Sushi & Sashimi</h3>
                        <p>Cá tươi nhập khẩu mỗi ngày, thái lát tinh tế bởi đầu bếp chuyên nghiệp.</p>
                    </article>

                    <article>
                        <span>02</span>
                        <h3>Ramen</h3>
                        <p>Nước dùng ninh xương 12 giờ, sợi mì tự làm đậm đà hương vị Nhật.</p>
                    </article>

                    <article>
                        <span>03</span>
                        <h3>Tempura</h3>
                        <p>Chiên giòn vừa tới, lớp bột mỏng nhẹ giữ trọn vị ngọt nguyên liệu.</p>
                    </article>

                    <article>
                        <span>04</span>
                        <h3>Wagyu</h3>
                        <p>Thịt bò Wagyu thượng hạng, nướng teppanyaki ngay tại bàn.</p>
                    </article>
                </div>
            </section>

            <section id="features" className="restaurant-feature-section">
                <div className="restaurant-feature-content">
                    <p className="restaurant-section-label">Vì sao chọn chúng tôi</p>

                    <h2>Trải nghiệm ẩm thực trọn vẹn</h2>

                    <div className="restaurant-feature-list">
                        <div>
                            <strong>Nguyên liệu tươi mỗi ngày</strong>
                            <p>Hải sản và rau củ được nhập khẩu, tuyển chọn kỹ lưỡng hằng ngày.</p>
                        </div>

                        <div>
                            <strong>Đầu bếp Nhật Bản</strong>
                            <p>Đội ngũ đầu bếp giàu kinh nghiệm, am hiểu ẩm thực Nhật truyền thống.</p>
                        </div>

                        <div>
                            <strong>Không gian đậm chất Nhật</strong>
                            <p>Thiết kế tinh tế, ấm cúng, lý tưởng cho gia đình, bạn bè và đối tác.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="contact" className="restaurant-cta">
                <p className="restaurant-section-label">Đặt bàn ngay</p>
                <h2>Sẵn sàng thưởng thức hương vị Nhật Bản?</h2>
                <p>Đặt bàn ngay hôm nay để trải nghiệm ẩm thực Nihon Bites.</p>

                <Link className="restaurant-primary-btn" to="/login">
                    Đặt bàn ngay
                </Link>
            </section>

            <footer className="restaurant-footer">
                <p>© 2026 Nihon Bites. Ẩm thực Nhật Bản chính thống.</p>
            </footer>
        </main>
    )
}
