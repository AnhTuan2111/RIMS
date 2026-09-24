import {AxiosError, AxiosHeaders} from 'axios'
import {describe, expect, it} from 'vitest'

import {getErrorMessage, isApiErrorResponse, isRequestCanceled} from './error'

/** Dựng một lỗi axios có phần phản hồi giống hệt backend trả về. */
function loiApi(data: unknown, status = 400): AxiosError {
    const error = new AxiosError('Request failed with status code ' + status)

    error.response = {
        data,
        status,
        statusText: '',
        headers: new AxiosHeaders(),
        config: {headers: new AxiosHeaders()},
    }

    return error
}

describe('Đọc lỗi từ backend', () => {
    describe('Lấy câu thông báo', () => {
        it('ưu tiên message vì đó là câu tiếng Việt dành cho người dùng', () => {
            const msg = getErrorMessage(
                loiApi({
                    status: 400,
                    error: 'Yêu cầu không hợp lệ',
                    message: 'Khách đưa thiếu tiền!',
                    details: {amountPaid: 'phải lớn hơn 0'},
                }),
            )

            expect(msg).toBe('Khách đưa thiếu tiền!')
        })

        it('không có message thì lấy error', () => {
            expect(getErrorMessage(loiApi({error: 'Không tìm thấy'}))).toBe(
                'Không tìm thấy',
            )
        })

        it('chỉ có details thì ghép từng trường', () => {
            const msg = getErrorMessage(
                loiApi({details: {phone: 'Số điện thoại không được để trống'}}),
            )

            expect(msg).toContain('Số điện thoại không được để trống')
        })

        it('phản hồi là chuỗi thì dùng luôn chuỗi đó', () => {
            expect(getErrorMessage(loiApi('Lỗi máy chủ'))).toBe('Lỗi máy chủ')
        })

        it('không đọc được gì thì dùng câu dự phòng', () => {
            expect(getErrorMessage(null)).toBe('Đã có lỗi xảy ra. Vui lòng thử lại.')
            expect(getErrorMessage({}, 'Không tải được danh sách bàn.')).toBe(
                'Không tải được danh sách bàn.',
            )
        })

        it('lỗi JavaScript thường thì lấy message của nó', () => {
            expect(getErrorMessage(new Error('Mất kết nối'))).toBe('Mất kết nối')
        })

        it('chuỗi rỗng hoặc toàn khoảng trắng không được coi là thông báo', () => {
            expect(getErrorMessage('   ', 'Dự phòng')).toBe('Dự phòng')
        })
    })

    describe('Request bị huỷ', () => {
        it('trả chuỗi rỗng để nơi gọi biết mà im lặng', () => {
            // Người dùng rời trang giữa chừng là chuyện bình thường, không phải
            // lỗi — hiện thông báo đỏ lên là làm họ hoảng.
            const canceled = new AxiosError('canceled')
            canceled.code = 'ERR_CANCELED'

            expect(getErrorMessage(canceled)).toBe('')
        })

        it('nhận ra cả ba cách trình duyệt báo huỷ', () => {
            expect(isRequestCanceled({name: 'CanceledError'})).toBe(true)
            expect(isRequestCanceled({code: 'ERR_CANCELED'})).toBe(true)
            expect(isRequestCanceled({message: 'canceled'})).toBe(true)
        })

        it('lỗi thật thì không nhầm thành huỷ', () => {
            expect(isRequestCanceled(new Error('Network Error'))).toBe(false)
            expect(isRequestCanceled(null)).toBe(false)
        })
    })

    describe('Nhận dạng phản hồi lỗi chuẩn', () => {
        it('đủ status và message mới tính là phản hồi lỗi của backend', () => {
            expect(isApiErrorResponse({status: 400, message: 'Sai'})).toBe(true)
            expect(isApiErrorResponse({status: 400})).toBe(false)
            expect(isApiErrorResponse({message: 'Sai'})).toBe(false)
            expect(isApiErrorResponse(null)).toBe(false)
            expect(isApiErrorResponse('Sai')).toBe(false)
        })
    })
})
