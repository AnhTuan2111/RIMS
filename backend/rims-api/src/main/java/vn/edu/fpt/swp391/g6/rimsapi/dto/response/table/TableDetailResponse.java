package vn.edu.fpt.swp391.g6.rimsapi.dto.response.table;

import java.time.LocalDateTime;

import lombok.*;

import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TableDetailResponse
{
    private Integer tableId;
    private String tableNumber;
    private Integer capacity;
    private TableStatus status;
    private LocalDateTime upcomingReservationTime;
    private String upcomingCustomerName;

    /**
     * Chỗ đứng trên sơ đồ mặt bằng, tính bằng Ô LƯỚI chứ không phải pixel.
     *
     * <p>Phục vụ nhìn sơ đồ để tìm bàn ngoài đời, nên sơ đồ phải giống mặt bằng
     * thật. NULL nghĩa là bàn chưa được quản lý đặt chỗ; màn xếp những bàn đó
     * thành hàng ở cuối thay vì dồn hết vào góc trên trái.
     */
    private Integer layoutX;
    private Integer layoutY;
    private Integer layoutW;
    private Integer layoutH;

    /** Khu vực: "Tầng 1", "Sân vườn". Dùng để chia sơ đồ thành nhiều mảng. */
    private String zone;
}
