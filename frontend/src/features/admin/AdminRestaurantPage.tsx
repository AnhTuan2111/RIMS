import {useCallback, useEffect, useState} from 'react'
import {Check, Store} from 'lucide-react'

import {useRestaurant} from '@/app/providers/useRestaurant'
import * as restaurantApi from '@/shared/api/restaurant'
import type {RestaurantProfile} from '@/shared/api/restaurant'
import {ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader} from '@/shared/components/ui'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

const EMPTY_FORM: RestaurantProfile = {
    name: '',
    tagline: '',
    description: '',
    logoUrl: '',
    heroImageUrl: '',
    address: '',
    phone: '',
    email: '',
    openingHours: '',
}

interface FieldProps {
    id: keyof RestaurantProfile
    label: string
    hint?: string
    value: string
    multiline?: boolean
    placeholder?: string
    onChange: (value: string) => void
}

function Field({id, label, hint, value, multiline, placeholder, onChange}: FieldProps) {
    return (
        <div className="rk-field">
            <label className="rk-field__label" htmlFor={id}>
                {label}
            </label>

            {multiline ? (
                <textarea
                    className="rk-input"
                    id={id}
                    rows={4}
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                />
            ) : (
                <input
                    className="rk-input"
                    id={id}
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}

            {hint && <p className="rk-field__hint">{hint}</p>}
        </div>
    )
}

/**
 * Cấu hình nhận diện nhà hàng.
 *
 * <p>Thay cho việc viết cứng tên quán và mô tả trong mã nguồn: một bản cài đặt
 * RIMS nay phục vụ được bất kỳ nhà hàng nào, chủ quán tự điền thông tin của mình.
 */
export default function AdminRestaurantPage() {
    const {refresh} = useRestaurant()

    const [form, setForm] = useState<RestaurantProfile>(EMPTY_FORM)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [savedAt, setSavedAt] = useState<number | null>(null)

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const data = await restaurantApi.getProfile(signal)

            if (signal?.aborted) {
                return
            }

            // API trả null cho ô trống; form cần chuỗi rỗng để input không thành
            // uncontrolled.
            setForm({
                name: data.name ?? '',
                tagline: data.tagline ?? '',
                description: data.description ?? '',
                logoUrl: data.logoUrl ?? '',
                heroImageUrl: data.heroImageUrl ?? '',
                address: data.address ?? '',
                phone: data.phone ?? '',
                email: data.email ?? '',
                openingHours: data.openingHours ?? '',
            })
            setError(null)
        } catch (requestError: unknown) {
            if (signal?.aborted || isRequestCanceled(requestError)) {
                return
            }

            setError(getErrorMessage(requestError, 'Không thể tải cấu hình nhà hàng.'))
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()

        // Loader chỉ đặt state SAU khi await xong; rule không đọc được điều đó.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- xem ghi chú trên
        void load(controller.signal)

        return () => controller.abort()
    }, [load])

    function setField(key: keyof RestaurantProfile, value: string) {
        setForm((current) => ({...current, [key]: value}))
        setSavedAt(null)
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        setIsSaving(true)
        setSaveError(null)

        try {
            await restaurantApi.updateProfile(form)

            // Cập nhật luôn cho trang chủ, trang đăng nhập và sidebar.
            await refresh()

            setSavedAt(Date.now())
        } catch (requestError: unknown) {
            setSaveError(getErrorMessage(requestError, 'Không lưu được cấu hình.'))
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <LoadingState title="Đang tải cấu hình nhà hàng…" />
    }

    if (error) {
        return <ErrorState message={error} onRetry={() => void load()} />
    }

    return (
        <PageCard>
            <PageHeader
                title="Cấu hình nhà hàng"
                description="Tên, mô tả và thông tin liên hệ hiển thị ở trang chủ, trang đăng nhập và trên hoá đơn."
            />

            <form className="rk-stack" onSubmit={handleSubmit}>
                <div className="rk-formgrid">
                    <Field
                        id="name"
                        label="Tên nhà hàng"
                        value={form.name}
                        placeholder="Ví dụ: Quán Ăn Ngon"
                        onChange={(value) => setField('name', value)}
                    />

                    <Field
                        id="tagline"
                        label="Khẩu hiệu"
                        hint="Một câu ngắn hiện ngay dưới tên."
                        value={form.tagline ?? ''}
                        placeholder="Ví dụ: Ẩm thực Nhật Bản đương đại"
                        onChange={(value) => setField('tagline', value)}
                    />

                    <Field
                        id="phone"
                        label="Số điện thoại"
                        value={form.phone ?? ''}
                        placeholder="0xxxxxxxxx"
                        onChange={(value) => setField('phone', value)}
                    />

                    <Field
                        id="email"
                        label="Email"
                        value={form.email ?? ''}
                        placeholder="lienhe@nhahang.vn"
                        onChange={(value) => setField('email', value)}
                    />

                    <Field
                        id="address"
                        label="Địa chỉ"
                        value={form.address ?? ''}
                        onChange={(value) => setField('address', value)}
                    />

                    <Field
                        id="openingHours"
                        label="Giờ mở cửa"
                        value={form.openingHours ?? ''}
                        placeholder="10:00 - 22:00 hằng ngày"
                        onChange={(value) => setField('openingHours', value)}
                    />

                    <Field
                        id="logoUrl"
                        label="Đường dẫn logo"
                        hint="Để trống thì giao diện hiện chữ cái đầu của tên nhà hàng."
                        value={form.logoUrl ?? ''}
                        placeholder="https://…"
                        onChange={(value) => setField('logoUrl', value)}
                    />

                    <Field
                        id="heroImageUrl"
                        label="Ảnh bìa trang chủ"
                        value={form.heroImageUrl ?? ''}
                        placeholder="https://…"
                        onChange={(value) => setField('heroImageUrl', value)}
                    />
                </div>

                <Field
                    id="description"
                    label="Giới thiệu"
                    hint="Đoạn mô tả hiện ở trang chủ."
                    multiline
                    value={form.description ?? ''}
                    onChange={(value) => setField('description', value)}
                />

                {saveError && <p className="rk-formerror">{saveError}</p>}

                <div className="rk-toolbar">
                    <button
                        className="rk-btn rk-btn--primary"
                        disabled={isSaving || form.name.trim().length === 0}
                        type="submit"
                    >
                        <Store className="rk-icon" aria-hidden="true" />
                        {isSaving ? 'Đang lưu…' : 'Lưu cấu hình'}
                    </button>

                    {/* Báo thành công lặng lẽ, không dùng toast ăn mừng. */}
                    {savedAt !== null && !isSaving && (
                        <span className="rk-savedhint">
                            <Check className="rk-icon" aria-hidden="true" />
                            Đã lưu
                        </span>
                    )}
                </div>
            </form>
        </PageCard>
    )
}
