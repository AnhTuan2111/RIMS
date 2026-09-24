package vn.edu.fpt.swp391.g6.rimsapi.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;

/**
 * Toàn bộ quy tắc tính tiền của một hoá đơn, không phụ thuộc Spring hay database.
 *
 * <p>Trước đây các quy tắc này nằm rải ở bốn chỗ trong {@code CashierServiceImpl}:
 * xem trước hoá đơn, thanh toán tiền mặt, tạo URL VNPay, và áp dụng điểm. Chính
 * chú thích trong mã cũ đã cảnh báo "sửa rule tính điểm phải sửa khớp cả 2 chỗ",
 * và hai chỗ đó thực tế đã lệch nhau: bước xem trước không kiểm tra trần 50%,
 * nên thu ngân có thể nhận đủ tiền theo số hiển thị rồi mới bị từ chối ở bước
 * ghi hoá đơn.
 *
 * <p>Mọi phép tính dùng {@link BigDecimal}. Không dùng double cho tiền.
 */
public final class PaymentCalculator
{

    /** Thuế giá trị gia tăng áp cho mọi hoá đơn. */
    public static final BigDecimal VAT_RATE = new BigDecimal("0.10");

    /** Một điểm tích luỹ đổi được bao nhiêu đồng. */
    public static final BigDecimal DONG_PER_POINT = new BigDecimal("1000");

    /** Điểm chỉ được giảm tối đa nửa hoá đơn, phần còn lại khách phải trả thật. */
    public static final BigDecimal MAX_POINT_DISCOUNT_RATE = new BigDecimal("0.5");

    /** Tỷ lệ tích điểm trên số tiền thực trả. */
    public static final BigDecimal EARN_RATE = new BigDecimal("0.01");

    private PaymentCalculator()
    {
    }

    /**
     * Thuế trên số tiền trước thuế.
     */
    public static BigDecimal vatOf(BigDecimal totalBeforeVat)
    {
        return nullToZero(totalBeforeVat).multiply(VAT_RATE);
    }

    /**
     * Số tiền sau thuế, trước khi trừ điểm.
     */
    public static BigDecimal totalAfterVat(BigDecimal totalBeforeVat)
    {
        BigDecimal base = nullToZero(totalBeforeVat);
        return base.add(vatOf(base));
    }

    /**
     * Số tiền được giảm khi dùng {@code points} điểm.
     *
     * @throws BusinessRuleException nếu vượt trần {@value #MAX_POINT_DISCOUNT_RATE}
     *                               của hoá đơn
     */
    public static BigDecimal discountForPoints(int points, BigDecimal amountAfterVat)
    {
        if (points <= 0)
        {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = new BigDecimal(points).multiply(DONG_PER_POINT);
        BigDecimal maxDiscount = nullToZero(amountAfterVat).multiply(MAX_POINT_DISCOUNT_RATE);

        if (discount.compareTo(maxDiscount) > 0)
        {
            throw new BusinessRuleException("Số điểm sử dụng vượt quá 50% hóa đơn cho phép!");
        }

        return discount;
    }

    /**
     * Số tiền khách phải trả sau khi trừ điểm. Không bao giờ âm.
     *
     * <p>Dùng chung cho cả bước xem trước lẫn bước ghi hoá đơn, để hai bước không
     * thể lệch nhau nữa.
     */
    public static BigDecimal amountDue(BigDecimal amountAfterVat, int points)
    {
        BigDecimal base = nullToZero(amountAfterVat);
        BigDecimal due = base.subtract(discountForPoints(points, base));
        return due.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : due;
    }

    /**
     * Điểm khách được cộng thêm: {@value #EARN_RATE} số tiền thực trả, quy ra
     * điểm theo {@value #DONG_PER_POINT} đồng một điểm, làm tròn XUỐNG.
     */
    public static int pointsEarned(BigDecimal amountPaidAfterDiscount)
    {
        return nullToZero(amountPaidAfterDiscount)
                .multiply(EARN_RATE)
                .divide(DONG_PER_POINT, 0, RoundingMode.DOWN)
                .intValue();
    }

    /**
     * Tiền thừa phải trả lại khách.
     *
     * @throws BusinessRuleException nếu khách đưa thiếu
     */
    public static BigDecimal changeDue(BigDecimal amountPaid, BigDecimal amountDue)
    {
        BigDecimal paid = nullToZero(amountPaid);
        BigDecimal due = nullToZero(amountDue);

        if (paid.compareTo(due) < 0)
        {
            throw new BusinessRuleException("Khách đưa thiếu tiền!");
        }

        return paid.subtract(due);
    }

    private static BigDecimal nullToZero(BigDecimal value)
    {
        return value != null ? value : BigDecimal.ZERO;
    }
}
