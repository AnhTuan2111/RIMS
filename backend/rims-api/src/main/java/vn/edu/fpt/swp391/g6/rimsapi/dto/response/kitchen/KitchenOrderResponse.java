package vn.edu.fpt.swp391.g6.rimsapi.dto.response.kitchen;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;

@Getter
@Setter
public class KitchenOrderResponse
{

    private Long orderItemId;

    private Long orderId;

    private String tableNumber;

    private String dishName;

    private Integer quantity;

    /**
     * Ghi chú phục vụ nhập khi gọi món ("ít cay", "không hành").
     *
     * <p>Trước đây trường này chỉ có ở API xem chi tiết từng món, nên đầu bếp phải bấm
     * vào từng phiếu mới đọc được yêu cầu của khách. Đưa thẳng vào danh sách để bếp
     * thấy ngay, đỡ một lượt bấm cho mỗi món.
     */
    private String note;

    private OrderItemStatus status;
    private LocalDateTime createdAt;
}
