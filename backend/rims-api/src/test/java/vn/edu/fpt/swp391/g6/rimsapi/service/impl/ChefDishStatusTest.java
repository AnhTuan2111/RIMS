package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Order;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.OrderItemRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.OrderRepository;
import vn.edu.fpt.swp391.g6.rimsapi.util.WebSocketBroadcaster;

/**
 * Luồng đổi trạng thái món ở Bếp.
 *
 * <p>Trước đây endpoint "xong món" nhận mọi giá trị enum, nên gửi CANCELLED vào
 * đó là huỷ được món mà bỏ qua toàn bộ ràng buộc của luồng huỷ.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Đổi trạng thái món ở Bếp")
class ChefDishStatusTest
{

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private WebSocketBroadcaster webSocketBroadcaster;

    @InjectMocks
    private ChefServiceImpl service;

    private OrderItem item;

    @BeforeEach
    void setUp()
    {
        item = new OrderItem();
        item.setId(10L);
        item.setStatus(OrderItemStatus.PREPARING);
        item.setSubTotal(new BigDecimal("100000"));

        // Huỷ món có tính lại tổng tiền của đơn, nên đơn phải biết món của nó.
        Order order = new Order();
        order.setId(1L);
        order.setOrderItems(new ArrayList<>(List.of(item)));

        item.setOrder(order);

        lenient().when(orderItemRepository.findById(10L)).thenReturn(Optional.of(item));
        lenient().when(orderItemRepository.save(any(OrderItem.class)))
                .thenAnswer(i -> i.getArgument(0));
    }

    @Nested
    @DisplayName("Báo xong món")
    class Complete
    {

        @Test
        @DisplayName("món đang chế biến thì chuyển sang hoàn thành")
        void monDangCheBienThiXong()
        {
            service.updateDishStatus(10L, OrderItemStatus.COMPLETED);

            assertThat(item.getStatus()).isEqualTo(OrderItemStatus.COMPLETED);
        }

        @Test
        @DisplayName("không huỷ món được qua đường này")
        void khongHuyDuocQuaDuongNay()
        {
            assertThatThrownBy(() -> service.updateDishStatus(10L, OrderItemStatus.CANCELLED))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("huỷ món");

            assertThat(item.getStatus()).isEqualTo(OrderItemStatus.PREPARING);
            verify(orderItemRepository, never()).save(any());
        }

        @Test
        @DisplayName("gửi lại PREPARING cũng bị từ chối")
        void guiLaiPreparingCungTuChoi()
        {
            assertThatThrownBy(() -> service.updateDishStatus(10L, OrderItemStatus.PREPARING))
                    .isInstanceOf(BusinessRuleException.class);
        }

        @Test
        @DisplayName("món đã xong rồi thì không đổi nữa")
        void monDaXongThiKhongDoi()
        {
            item.setStatus(OrderItemStatus.COMPLETED);

            assertThatThrownBy(() -> service.updateDishStatus(10L, OrderItemStatus.COMPLETED))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Huỷ món")
    class Cancel
    {

        @Test
        @DisplayName("có lý do thì huỷ được và ghi lại lý do")
        void coLyDoThiHuyDuoc()
        {
            service.requestCancel(10L, "  Hết nguyên liệu  ");

            assertThat(item.getStatus()).isEqualTo(OrderItemStatus.CANCELLED);
            assertThat(item.getCancelReason()).isEqualTo("Hết nguyên liệu");
            assertThat(item.getCancelRequestedAt()).isNotNull();
        }

        @Test
        @DisplayName("không có lý do thì từ chối")
        void khongCoLyDoThiTuChoi()
        {
            assertThatThrownBy(() -> service.requestCancel(10L, null))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("lý do");

            assertThat(item.getStatus()).isEqualTo(OrderItemStatus.PREPARING);
        }

        @Test
        @DisplayName("lý do chỉ toàn khoảng trắng cũng bị từ chối")
        void lyDoToanKhoangTrangThiTuChoi()
        {
            assertThatThrownBy(() -> service.requestCancel(10L, "    "))
                    .isInstanceOf(BusinessRuleException.class);
        }

        @Test
        @DisplayName("lý do dài quá 500 ký tự thì từ chối")
        void lyDoQuaDaiThiTuChoi()
        {
            assertThatThrownBy(() -> service.requestCancel(10L, "a".repeat(501)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("500");
        }

        @Test
        @DisplayName("đúng 500 ký tự thì vẫn nhận")
        void dung500KyTuThiNhan()
        {
            assertThatCode(() -> service.requestCancel(10L, "a".repeat(500)))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("món đã huỷ rồi thì không huỷ lại")
        void monDaHuyThiKhongHuyLai()
        {
            item.setStatus(OrderItemStatus.CANCELLED);

            assertThatThrownBy(() -> service.requestCancel(10L, "Lý do khác"))
                    .isInstanceOf(IllegalStateException.class);
        }
    }
}
