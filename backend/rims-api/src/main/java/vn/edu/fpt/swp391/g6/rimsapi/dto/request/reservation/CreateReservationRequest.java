package vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation;

import java.time.LocalDateTime;

import jakarta.validation.constraints.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CreateReservationRequest
{
    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 50, message = "Tên khách hàng không được vượt quá 50 ký tự")
    @Pattern(regexp = "^\\p{L}+( \\p{L}+)*$", message = "Tên chỉ được chứa chữ cái và khoảng trắng")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0[0-9]{9}$", message = "Số điện thoại phải có 10 số và bắt đầu bằng 0")
    private String phone;

    @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
    private String note;

    /**
     * Không đặt trần cho giá trị này.
     *
     * <p>Trước đây có {@code @Max(12)} — số bàn của bản seed cũ viết thẳng vào
     * annotation. Nhà hàng thêm bàn thứ 13 qua màn Quản lý bàn thì không ai
     * đặt được bàn đó, mà thông báo lỗi chỉ nói "ID bàn không hợp lệ" nên
     * không lần ra được nguyên nhân. Thực đơn hiện tại có 14 bàn, tức là hai
     * bàn cuối đã nằm ngoài tầm với.
     *
     * <p>Bàn có tồn tại hay không là việc của cơ sở dữ liệu: cả
     * {@code WaiterServiceImpl} lẫn {@code CustomerServiceImpl} đều tra
     * {@code findById} rồi ném lỗi nếu không thấy. Chốt chặn ở đây chỉ còn
     * kiểm tra giá trị âm hoặc 0 — thứ không phụ thuộc vào dữ liệu.
     */
    @NotNull(message = "Bàn không được để trống")
    @Min(value = 1, message = "ID bàn phải lớn hơn 0")
    private Integer tableId;

    @NotNull(message = "Thời gian đặt bàn không được để trống")
    private LocalDateTime reservationTime;
}
