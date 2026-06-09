import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicHome } from '../../api/home'
import type { PublicHomeContent } from '../../types/home'
import { getErrorMessage } from '../../utils/error'

export function HomePage() {
    const [content, setContent] = useState<PublicHomeContent | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadHomeContent() {
            try {
                const data = await getPublicHome()
                setContent(data)
            } catch (err) {
                setError(getErrorMessage(err))
            } finally {
                setIsLoading(false)
            }
        }

        void loadHomeContent()
    }, [])

    if (isLoading) {
        return (
            <main className="app-loading home-loading">
                <p>Đang tải trang chủ...</p>
            </main>
        )
    }

    if (error || !content) {
        return (
            <main className="home-error-layout">
                <div className="home-error-card">
                    <h1>Không thể tải trang chủ</h1>
                    <p>{error ?? 'Dữ liệu trang chủ chưa được cấu hình.'}</p>
                    <Link className="home-cta" to="/login">
                        Đăng nhập hệ thống
                    </Link>
                </div>
            </main>
        )
    }

    const { brand, contact } = content

    return (
        <div className="home-page">
            <header className="home-header">
                <div className="home-header-inner">
                    <div>
                        <p className="home-eyebrow">Chào mừng đến với</p>
                        <h1>{brand.brandName}</h1>
                        {brand.tagline && <p className="home-tagline">{brand.tagline}</p>}
                    </div>
                    <Link className="home-login-btn" to="/login">
                        Đăng nhập
                    </Link>
                </div>
            </header>

            <section className="home-hero">
                {brand.heroImageUrl ? (
                    <img className="home-hero-image" src={brand.heroImageUrl} alt={brand.brandName} />
                ) : (
                    <div className="home-hero-placeholder" aria-hidden="true" />
                )}
                <div className="home-hero-overlay">
                    <h2>{brand.brandName}</h2>
                    {brand.tagline && <p>{brand.tagline}</p>}
                </div>
            </section>

            {brand.description && (
                <section className="home-section">
                    <h2>Về chúng tôi</h2>
                    <p className="home-about">{brand.description}</p>
                </section>
            )}

            <section className="home-section home-contact-section">
                <h2>Liên hệ</h2>
                <div className="home-contact-grid">
                    <div>
                        <h3>Địa chỉ</h3>
                        <p>{contact.address}</p>
                    </div>
                    <div>
                        <h3>Điện thoại</h3>
                        <p>
                            <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                        </p>
                    </div>
                    <div>
                        <h3>Email</h3>
                        <p>
                            {contact.email ? (
                                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                            ) : (
                                '—'
                            )}
                        </p>
                    </div>
                    <div>
                        <h3>Giờ mở cửa</h3>
                        <p>{contact.openingHours}</p>
                    </div>
                </div>
                {contact.mapUrl && (
                    <a className="home-map-link" href={contact.mapUrl} target="_blank" rel="noreferrer">
                        Xem trên bản đồ
                    </a>
                )}
            </section>

            <footer className="home-footer">
                <p>© {new Date().getFullYear()} {brand.brandName}. Nhân viên vui lòng đăng nhập để vào hệ thống.</p>
                <Link className="home-cta" to="/login">
                    Đăng nhập hệ thống
                </Link>
            </footer>
        </div>
    )
}
