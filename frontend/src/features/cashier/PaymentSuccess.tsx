import {Check, Download} from 'lucide-react'

import {useNavigate, useSearchParams} from 'react-router-dom'

import * as cashierApi from '@/shared/api/cashier'
import {isRequestCanceled} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'

/**
 * Trang VNPay trả về khi thanh toán thành công.
 *
 * <p>Trang này nằm ngoài khung quản trị: không thanh bên, không thanh trên,
 * vì người dùng vừa từ cổng thanh toán quay lại chứ không đi từ trong hệ
 * thống ra. Trước đây nó tự dựng thẻ, nút và màu bằng mười đối tượng style
 * trong JS — nút còn đặt thẳng `color: white`, nên ở chế độ tối chữ trắng
 * nằm trên nền sáng.
 */
export default function PaymentSuccess() {
    const {notify} = useToast()

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const invoiceId = searchParams.get('invoiceId')

    async function handleDownloadPdf() {
        if (!invoiceId) {
            return
        }

        try {
            const response = await cashierApi.downloadInvoicePdf(Number(invoiceId))

            const blob = new Blob([response.data as BlobPart], {
                type: 'application/pdf',
            })

            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')

            link.href = url
            link.setAttribute('download', `Invoice-${invoiceId}.pdf`)

            document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(url)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[PAYMENT_SUCCESS_DOWNLOAD_PDF_ERROR]', requestError)

            notify('Không thể tải PDF! Vui lòng thử lại.', {tone: 'alert'})
        }
    }

    return (
        <div className="rk-result">
            <div className="rk-feedback rk-feedback--lg">
                <div className="rk-feedback__icon rk-feedback__icon--ok">
                    <Check className="rk-icon" aria-hidden="true" />
                </div>

                <div>
                    <h1 className="rk-feedback__title">Thanh toán thành công</h1>

                    <p className="rk-feedback__text">
                        Giao dịch qua VNPay đã hoàn tất. Hoá đơn của quý khách đã được lưu
                        lại hệ thống.
                    </p>

                    {invoiceId && (
                        <p className="rk-feedback__text">
                            Mã hoá đơn:{' '}
                            <strong className="rk-num">INV-{invoiceId}</strong>
                        </p>
                    )}

                    <div className="rk-feedback__actions">
                        <button
                            type="button"
                            className="rk-btn rk-btn--primary"
                            disabled={!invoiceId}
                            onClick={() => void handleDownloadPdf()}
                        >
                            <Download className="rk-icon" aria-hidden="true" />
                            Tải PDF hoá đơn
                        </button>

                        <button
                            type="button"
                            className="rk-btn"
                            onClick={() => navigate('/cashier/payments')}
                        >
                            Về màn hình Thu ngân
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
