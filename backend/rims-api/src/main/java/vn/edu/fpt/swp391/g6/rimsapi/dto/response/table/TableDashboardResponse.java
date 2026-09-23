package vn.edu.fpt.swp391.g6.rimsapi.dto.response.table;

import java.math.BigDecimal;

import lombok.*;

import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TableDashboardResponse
{
    private Integer tableId;
    private String tableNumber;
    private TableStatus status; // xem ban nao có order hay không
    private Long orderId; // hiển thị cái order id của bàn nào đang có phục vụ

    /**
     * Tiền tạm tính của đơn đang mở tại bàn, null nếu bàn trống.
     *
     * <p>Lấy từ Order.totalAmount vốn đã nạp sẵn trong cùng truy vấn, nên không tốn
     * thêm lần gọi DB nào. Thu ngân nhìn sơ đồ bàn là thấy ngay bàn nào bao nhiêu
     * tiền, khỏi phải bấm vào từng bàn.
     */
    private BigDecimal totalAmount;
}
