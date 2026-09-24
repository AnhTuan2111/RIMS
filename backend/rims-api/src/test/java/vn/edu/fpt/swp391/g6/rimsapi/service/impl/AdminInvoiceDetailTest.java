package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.edu.fpt.swp391.g6.rimsapi.dto.response.report.InvoiceDetailResponse;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Dish;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Order;
import vn.edu.fpt.swp391.g6.rimsapi.entity.OrderItem;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.enums.OrderItemStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.InvoiceRepository;

/**
 * Chi tiết hoá đơn.
 *
 * <p>Món bị huỷ không được tính tiền, nên cũng không được nằm trong hoá đơn.
 * Bản cũ lấy toàn bộ order item rồi suy VAT bằng phép trừ, nên một hoá đơn có
 * món bị huỷ hiện ra VAT ÂM và thành tiền nhỏ hơn tạm tính.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Chi tiết hoá đơn")
class AdminInvoiceDetailTest
{

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private AdminServiceImpl service;

    private Invoice invoice;
    private Order order;

    @BeforeEach
    void setUp()
    {
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber("T10");

        order = new Order();
        order.setId(3L);
        order.setTable(table);
        order.setOrderItems(new ArrayList<>());

        invoice = new Invoice();
        invoice.setId(3L);
        invoice.setOrder(order);
        invoice.setInvoiceDate(LocalDateTime.now());
        invoice.setPayments(List.of());

        when(invoiceRepository.findById(3L)).thenReturn(Optional.of(invoice));
    }

    private void addItem(String name, int quantity, String unitPrice, OrderItemStatus status)
    {
        Dish dish = new Dish();
        dish.setName(name);

        OrderItem item = new OrderItem();
        item.setDish(dish);
        item.setQuantity(quantity);
        item.setUnitPrice(new BigDecimal(unitPrice));
        item.setSubTotal(new BigDecimal(unitPrice).multiply(BigDecimal.valueOf(quantity)));
        item.setStatus(status);

        order.getOrderItems().add(item);
    }

    @Test
    @DisplayName("món đã huỷ không nằm trong hoá đơn")
    void monDaHuyKhongNamTrongHoaDon()
    {
        addItem("Heo sữa quay nguyên con", 1, "459000", OrderItemStatus.CANCELLED);
        addItem("Cơm thố thịt kho Bắc Kinh", 3, "99000", OrderItemStatus.COMPLETED);

        invoice.setFinalAmount(new BigDecimal("326700"));
        invoice.setRestaurantRevenueAmount(new BigDecimal("297000"));

        InvoiceDetailResponse res = service.getInvoiceDetail(3L);

        assertThat(res.getItems()).hasSize(1);
        assertThat(res.getItems().getFirst().getDishName()).isEqualTo("Cơm thố thịt kho Bắc Kinh");
    }

    @Test
    @DisplayName("VAT không bao giờ âm khi đơn có món bị huỷ")
    void vatKhongAm()
    {
        // Đúng tình huống của hoá đơn ORD-3 trong dữ liệu mồi: tổng mọi dòng là
        // 1.496.000 nhưng khách chỉ trả cho 1.037.000 vì một món bị huỷ.
        addItem("Heo sữa quay nguyên con", 1, "459000", OrderItemStatus.CANCELLED);
        addItem("Cơm thố thịt kho Bắc Kinh", 3, "99000", OrderItemStatus.COMPLETED);
        addItem("Mì cay khô Vũ Hán", 2, "79000", OrderItemStatus.COMPLETED);
        addItem("Bánh trứng Hồng Kông", 3, "45000", OrderItemStatus.COMPLETED);
        addItem("Bò lúc lắc Quảng Đông", 3, "149000", OrderItemStatus.COMPLETED);

        invoice.setFinalAmount(new BigDecimal("1140700"));
        invoice.setRestaurantRevenueAmount(new BigDecimal("1037000"));

        InvoiceDetailResponse res = service.getInvoiceDetail(3L);

        assertThat(res.getTotalBeforeVat()).isEqualByComparingTo("1037000");
        assertThat(res.getVatAmount()).isEqualByComparingTo("103700");
        assertThat(res.getVatAmount()).isPositive();

        // Thành tiền phải bằng tạm tính cộng VAT, không nhỏ hơn tạm tính
        assertThat(res.getFinalAmount())
                .isEqualByComparingTo(res.getTotalBeforeVat().add(res.getVatAmount()));
    }

    @Test
    @DisplayName("tổng các dòng món khớp với tạm tính")
    void tongCacDongKhopTamTinh()
    {
        addItem("Món huỷ", 2, "100000", OrderItemStatus.CANCELLED);
        addItem("Món A", 2, "50000", OrderItemStatus.COMPLETED);
        addItem("Món B", 1, "30000", OrderItemStatus.PREPARING);

        invoice.setFinalAmount(new BigDecimal("143000"));
        invoice.setRestaurantRevenueAmount(new BigDecimal("130000"));

        InvoiceDetailResponse res = service.getInvoiceDetail(3L);

        BigDecimal sumOfLines = res.getItems().stream()
                .map(item -> item.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(sumOfLines).isEqualByComparingTo(res.getTotalBeforeVat());
    }

    @Test
    @DisplayName("hoá đơn cũ chưa có cột doanh thu thì cộng lại từ các dòng còn hiệu lực")
    void hoaDonCuThiCongLaiTuCacDong()
    {
        addItem("Món huỷ", 1, "459000", OrderItemStatus.CANCELLED);
        addItem("Món A", 2, "50000", OrderItemStatus.COMPLETED);

        invoice.setFinalAmount(new BigDecimal("110000"));
        invoice.setRestaurantRevenueAmount(null);

        InvoiceDetailResponse res = service.getInvoiceDetail(3L);

        assertThat(res.getTotalBeforeVat()).isEqualByComparingTo("100000");
        assertThat(res.getVatAmount()).isEqualByComparingTo("10000");
    }
}
