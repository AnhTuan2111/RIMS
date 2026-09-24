package vn.edu.fpt.swp391.g6.rimsapi.util;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;

/**
 * Khung giờ nhận đặt bàn.
 *
 * <p>Trước đây giờ mở/đóng được gõ thẳng ở hai nơi ({@code CustomerServiceImpl}
 * và {@code WaiterServiceImpl}), nên sửa một chỗ mà quên chỗ kia thì khách đặt
 * qua web và khách nhờ nhân viên đặt hộ sẽ nhận hai câu trả lời khác nhau cho
 * cùng một khung giờ.
 *
 * <p>Câu thông báo cũng được sinh từ chính hai mốc giờ này, nên không còn cảnh
 * đổi giờ mà quên sửa chuỗi in ra cho người dùng.
 */
@Component
public class ReservationWindow
{

    /** Sớm nhất nhận khách đặt. */
    public static final LocalTime OPEN_TIME = LocalTime.of(8, 0);

    /**
     * Muộn nhất nhận khách đặt.
     *
     * <p>Sớm hơn giờ bếp đóng ({@code OrderShift.EVENING} kết thúc 22:00) hai
     * tiếng, để lượt đặt cuối còn kịp gọi món và ăn. Không đủ trọn một lượt
     * xoay bàn ({@code ReservationConflictValidator#TABLE_TURNAROUND_MINUTES}
     * là 150 phút) — bàn đặt lúc 20:00 nhận khách tới khoảng 22:30.
     */
    public static final LocalTime LAST_BOOKING_TIME = LocalTime.of(20, 0);

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Chuỗi hiển thị cho người dùng, ví dụ {@code "08:00 - 20:00"}.
     */
    public String describe()
    {
        return OPEN_TIME.format(HH_MM) + " - " + LAST_BOOKING_TIME.format(HH_MM);
    }

    /**
     * Kiểm tra một thời điểm đặt bàn.
     *
     * @throws BusinessRuleException nếu ở quá khứ hoặc ngoài khung giờ nhận đặt
     */
    public void validate(LocalDateTime reservationTime)
    {
        if (reservationTime == null)
        {
            throw new BusinessRuleException("Thời gian đặt bàn không được để trống.");
        }

        if (reservationTime.isBefore(LocalDateTime.now()))
        {
            throw new BusinessRuleException("Thời gian đặt bàn phải ở trong tương lai.");
        }

        LocalTime time = reservationTime.toLocalTime();

        if (time.isBefore(OPEN_TIME) || time.isAfter(LAST_BOOKING_TIME))
        {
            throw new BusinessRuleException(
                    "Nhà hàng chỉ nhận đặt bàn trong khoảng " + describe());
        }
    }
}
