package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Invoice;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;
import vn.edu.fpt.swp391.g6.rimsapi.exception.ResourceNotFoundException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;

/**
 * Quy tắc chọn khách hàng khi thanh toán.
 *
 * <p>Trước đây {@code customerId} gửi lên không hề được kiểm: id trỏ tới tài
 * khoản nhân viên hay tài khoản đã khoá đều được nhận.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Điểm thưởng khi thanh toán")
class CashierLoyaltyTest
{

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CashierServiceImpl service;

    private Invoice invoice;

    @BeforeEach
    void setUp()
    {
        invoice = new Invoice();
        lenient().when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static User user(int id, RoleType role, boolean active, int points)
    {
        User u = new User();
        u.setId(id);
        u.setRole(role);
        u.setActive(active);
        u.setRewardPoints(points);
        u.setFullName("Nguyễn Văn A");
        return u;
    }

    /** Hai phương thức cần test là private nên gọi qua reflection. */
    private BigDecimal apply(String methodName, Integer customerId, Integer points,
            BigDecimal amount) throws Exception
    {
        Method m = CashierServiceImpl.class.getDeclaredMethod(methodName, Invoice.class,
                Integer.class, Integer.class, BigDecimal.class);
        m.setAccessible(true);

        try
        {
            return (BigDecimal) m.invoke(service, invoice, customerId, points, amount);
        } catch (java.lang.reflect.InvocationTargetException e)
        {
            throw (Exception) e.getCause();
        }
    }

    private BigDecimal beforePayment(Integer customerId, Integer points, String amount)
            throws Exception
    {
        return apply("applyLoyaltyPoints", customerId, points, new BigDecimal(amount));
    }

    private BigDecimal afterPayment(Integer customerId, Integer points, String amount)
            throws Exception
    {
        return apply("applyLoyaltyPointsAfterPayment", customerId, points,
                new BigDecimal(amount));
    }

    @Nested
    @DisplayName("Trước khi thu tiền thì từ chối thẳng")
    class BeforePayment
    {

        @Test
        @DisplayName("không chọn khách thì giữ nguyên số tiền")
        void khongChonKhach() throws Exception
        {
            assertThat(beforePayment(null, 0, "110000"))
                    .isEqualByComparingTo(new BigDecimal("110000"));
        }

        @Test
        @DisplayName("id trỏ tới tài khoản nhân viên thì từ chối")
        void idLaNhanVien()
        {
            when(userRepository.findById(1))
                    .thenReturn(Optional.of(user(1, RoleType.CASHIER, true, 500)));

            assertThatThrownBy(() -> beforePayment(1, 10, "110000"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("không phải tài khoản khách hàng");
        }

        @Test
        @DisplayName("tài khoản khách đã khoá thì từ chối")
        void khachDaKhoa()
        {
            when(userRepository.findById(5))
                    .thenReturn(Optional.of(user(5, RoleType.CUSTOMER, false, 500)));

            assertThatThrownBy(() -> beforePayment(5, 10, "110000"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("đã bị khoá");
        }

        @Test
        @DisplayName("không tìm thấy id thì từ chối")
        void khongTimThay()
        {
            when(userRepository.findById(999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> beforePayment(999, 0, "110000"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("dùng nhiều điểm hơn số đang có thì từ chối")
        void khongDuDiem()
        {
            when(userRepository.findById(5))
                    .thenReturn(Optional.of(user(5, RoleType.CUSTOMER, true, 3)));

            assertThatThrownBy(() -> beforePayment(5, 10, "110000"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("không đủ điểm");
        }

        @Test
        @DisplayName("khách hợp lệ: trừ điểm dùng, cộng điểm tích")
        void khachHopLe() throws Exception
        {
            User khach = user(5, RoleType.CUSTOMER, true, 100);
            when(userRepository.findById(5)).thenReturn(Optional.of(khach));

            BigDecimal due = beforePayment(5, 50, "1100000");

            assertThat(due).isEqualByComparingTo(new BigDecimal("1050000"));
            assertThat(invoice.getPointsUsedOnInvoice()).isEqualTo(50);
            assertThat(invoice.getPointsEarnedOnInvoice()).isEqualTo(10);
            // 100 - 50 dùng + 10 tích
            assertThat(khach.getRewardPoints()).isEqualTo(60);
        }
    }

    @Nested
    @DisplayName("Sau khi đã thu tiền thì không bao giờ ném lỗi")
    class AfterPayment
    {

        @Test
        @DisplayName("khách biến mất: vẫn giữ đúng số tiền VNPay đã thu")
        void khachBienMat() throws Exception
        {
            when(userRepository.findById(999)).thenReturn(Optional.empty());

            // VNPay đã thu 1.100.000 - 50.000 = 1.050.000
            assertThat(afterPayment(999, 50, "1100000"))
                    .isEqualByComparingTo(new BigDecimal("1050000"));
        }

        @Test
        @DisplayName("id hoá ra là nhân viên: không ném lỗi, chỉ bỏ phần điểm")
        void idLaNhanVien() throws Exception
        {
            when(userRepository.findById(1))
                    .thenReturn(Optional.of(user(1, RoleType.CASHIER, true, 500)));

            assertThat(afterPayment(1, 50, "1100000"))
                    .isEqualByComparingTo(new BigDecimal("1050000"));

            assertThat(invoice.getCustomer()).isNull();
        }

        @Test
        @DisplayName("điểm đã tiêu chỗ khác: trừ hết số còn lại, không ném lỗi")
        void diemDaTieuChoKhac() throws Exception
        {
            User khach = user(5, RoleType.CUSTOMER, true, 20);
            when(userRepository.findById(5)).thenReturn(Optional.of(khach));

            // thoả thuận giảm 50 điểm nhưng sổ chỉ còn 20
            BigDecimal due = afterPayment(5, 50, "1100000");

            assertThat(due).isEqualByComparingTo(new BigDecimal("1050000"));
            assertThat(invoice.getPointsUsedOnInvoice()).isEqualTo(20);
            // 20 - 20 dùng + 10 tích
            assertThat(khach.getRewardPoints()).isEqualTo(10);
        }

        @Test
        @DisplayName("khách bị khoá giữa chừng: vẫn ghi nhận bình thường")
        void khachBiKhoaGiuaChung() throws Exception
        {
            User khach = user(5, RoleType.CUSTOMER, false, 100);
            when(userRepository.findById(5)).thenReturn(Optional.of(khach));

            assertThat(afterPayment(5, 50, "1100000"))
                    .isEqualByComparingTo(new BigDecimal("1050000"));

            assertThat(invoice.getCustomer()).isEqualTo(khach);
        }

        @Test
        @DisplayName("không chọn khách thì giữ nguyên số tiền")
        void khongChonKhach() throws Exception
        {
            assertThat(afterPayment(null, 0, "1100000"))
                    .isEqualByComparingTo(new BigDecimal("1100000"));
        }
    }
}
