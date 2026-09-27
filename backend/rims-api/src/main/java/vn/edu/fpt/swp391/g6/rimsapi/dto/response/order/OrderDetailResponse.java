package vn.edu.fpt.swp391.g6.rimsapi.dto.response.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderDetailResponse
{
    private Long orderId;
    private String tableNumber;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> orderItems;

    private BigDecimal totalAmountBeforeVat; // amount đầu
    private BigDecimal vatAmount; // VAT 10%
    private BigDecimal finalAmount; // tổng sau

    // Chỉ màn thu ngân điền hai trường dưới. Bản xem trước chỉ liệt kê món ĐÃ
    // XONG, nên trước đây bàn còn món đang nấu và bàn mà mọi món đã bị huỷ trông
    // y hệt nhau — "0 ₫, Thanh toán" — dù một bên phải chờ, một bên phải đóng.
    private List<String> pendingItems; // "Tên món ×2", các món còn đang nấu
    private Integer cancelledItemCount; // số dòng món bếp đã huỷ
}
