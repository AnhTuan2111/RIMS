export type InvoicePaymentMethod = 'CASH' | 'QRCODE' | string

export interface InvoiceHistoryResponse {
    invoiceId: number
    orderId: number
    tableNumber: string
    paymentMethod: InvoicePaymentMethod
    amount: number
    paymentDate: string
}
