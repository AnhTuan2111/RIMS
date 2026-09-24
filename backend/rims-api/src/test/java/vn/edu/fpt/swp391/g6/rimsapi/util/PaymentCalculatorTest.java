package vn.edu.fpt.swp391.g6.rimsapi.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;

@DisplayName("Tính tiền hoá đơn")
class PaymentCalculatorTest
{

    private static BigDecimal vnd(String value)
    {
        return new BigDecimal(value);
    }

    @Nested
    @DisplayName("Thuế")
    class Vat
    {

        @ParameterizedTest(name = "{0}đ trước thuế -> thuế {1}đ, tổng {2}đ")
        @CsvSource({
                "0, 0.00, 0.00",
                "100000, 10000.00, 110000.00",
                "399000, 39900.00, 438900.00",
                "1, 0.10, 1.10",
        })
        void tinhDungThue(String before, String expectedVat, String expectedTotal)
        {
            assertThat(PaymentCalculator.vatOf(vnd(before)))
                    .isEqualByComparingTo(vnd(expectedVat));

            assertThat(PaymentCalculator.totalAfterVat(vnd(before)))
                    .isEqualByComparingTo(vnd(expectedTotal));
        }

        @Test
        @DisplayName("null coi như 0, không ném lỗi")
        void nullCoiNhuKhong()
        {
            assertThat(PaymentCalculator.vatOf(null)).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(PaymentCalculator.totalAfterVat(null))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("không mất số lẻ như khi dùng double")
        void khongMatSoLe()
        {
            // 0.1 + 0.2 với double ra 0.30000000000000004
            BigDecimal total = PaymentCalculator.totalAfterVat(vnd("0.30"));

            assertThat(total).isEqualByComparingTo(vnd("0.33"));
            assertThat(total.toPlainString()).isEqualTo("0.3300");
        }
    }

    @Nested
    @DisplayName("Điểm thưởng")
    class Points
    {

        @Test
        @DisplayName("mỗi điểm trừ 1.000đ")
        void moiDiemTruMotNghin()
        {
            assertThat(PaymentCalculator.discountForPoints(30, vnd("110000")))
                    .isEqualByComparingTo(vnd("30000"));
        }

        @Test
        @DisplayName("0 điểm hoặc số âm thì không giảm gì")
        void khongDiemThiKhongGiam()
        {
            assertThat(PaymentCalculator.discountForPoints(0, vnd("110000")))
                    .isEqualByComparingTo(BigDecimal.ZERO);

            assertThat(PaymentCalculator.discountForPoints(-5, vnd("110000")))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("đúng trần 50% thì vẫn cho")
        void dungTranThiVanCho()
        {
            // hoá đơn 110.000đ, trần là 55.000đ = 55 điểm
            assertThat(PaymentCalculator.discountForPoints(55, vnd("110000")))
                    .isEqualByComparingTo(vnd("55000"));
        }

        @Test
        @DisplayName("quá trần 50% thì từ chối")
        void quaTranThiTuChoi()
        {
            assertThatThrownBy(() -> PaymentCalculator.discountForPoints(56, vnd("110000")))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("50%");
        }

        @ParameterizedTest(name = "trả {0}đ -> cộng {1} điểm")
        @CsvSource({
                "0, 0",
                "99999, 0",
                "100000, 1",
                "199999, 1",
                "438900, 4",
                "10000000, 100",
        })
        void tichDiemLamTronXuong(String paid, int expected)
        {
            assertThat(PaymentCalculator.pointsEarned(vnd(paid))).isEqualTo(expected);
        }

        @Test
        @DisplayName("tích điểm tính trên số thực trả, không phải số trước khi trừ điểm")
        void tichDiemTrenSoThucTra()
        {
            BigDecimal afterVat = PaymentCalculator.totalAfterVat(vnd("1000000")); // 1.100.000
            BigDecimal due = PaymentCalculator.amountDue(afterVat, 500); // -500.000

            assertThat(due).isEqualByComparingTo(vnd("600000"));
            assertThat(PaymentCalculator.pointsEarned(due)).isEqualTo(6);
            assertThat(PaymentCalculator.pointsEarned(afterVat)).isEqualTo(11);
        }
    }

    @Nested
    @DisplayName("Số tiền phải trả")
    class AmountDue
    {

        @Test
        @DisplayName("xem trước và ghi hoá đơn cho cùng một số")
        void xemTruocVaGhiHoaDonGiongNhau()
        {
            // Đây chính là chỗ từng lệch: bước xem trước không kiểm tra trần 50%
            // nên hiện ra số thấp hơn số thật, thu ngân nhận tiền xong mới bị
            // từ chối ở bước ghi hoá đơn.
            BigDecimal afterVat = PaymentCalculator.totalAfterVat(vnd("100000"));

            assertThatThrownBy(() -> PaymentCalculator.amountDue(afterVat, 100))
                    .isInstanceOf(BusinessRuleException.class);
        }

        @Test
        @DisplayName("không bao giờ âm")
        void khongBaoGioAm()
        {
            assertThat(PaymentCalculator.amountDue(BigDecimal.ZERO, 0))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("hoá đơn rỗng thì không phải trả gì")
        void hoaDonRongThiKhongPhaiTra()
        {
            assertThat(PaymentCalculator.amountDue(PaymentCalculator.totalAfterVat(null), 0))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Tiền thừa")
    class Change
    {

        @Test
        @DisplayName("trả dư thì thối lại phần dư")
        void traDuThiThoiLai()
        {
            assertThat(PaymentCalculator.changeDue(vnd("500000"), vnd("438900")))
                    .isEqualByComparingTo(vnd("61100"));
        }

        @Test
        @DisplayName("trả vừa đủ thì không thối")
        void traVuaDuThiKhongThoi()
        {
            assertThat(PaymentCalculator.changeDue(vnd("438900"), vnd("438900")))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("thiếu một đồng cũng từ chối")
        void thieuMotDongCungTuChoi()
        {
            assertThatThrownBy(() -> PaymentCalculator.changeDue(vnd("438899"), vnd("438900")))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("thiếu tiền");
        }
    }

    @Nested
    @DisplayName("Một hoá đơn trọn vẹn")
    class EndToEnd
    {

        @Test
        @DisplayName("khách có điểm, trả tiền mặt, nhận tiền thừa và điểm mới")
        void hoaDonCoDiem()
        {
            // 2 nồi lẩu 399.000đ + 1 chè 45.000đ
            BigDecimal beforeVat = vnd("399000").multiply(vnd("2")).add(vnd("45000"));
            assertThat(beforeVat).isEqualByComparingTo(vnd("843000"));

            BigDecimal afterVat = PaymentCalculator.totalAfterVat(beforeVat);
            assertThat(afterVat).isEqualByComparingTo(vnd("927300"));

            BigDecimal due = PaymentCalculator.amountDue(afterVat, 100);
            assertThat(due).isEqualByComparingTo(vnd("827300"));

            assertThat(PaymentCalculator.changeDue(vnd("1000000"), due))
                    .isEqualByComparingTo(vnd("172700"));

            assertThat(PaymentCalculator.pointsEarned(due)).isEqualTo(8);
        }

        @Test
        @DisplayName("khách vãng lai, không điểm")
        void hoaDonKhongDiem()
        {
            BigDecimal afterVat = PaymentCalculator.totalAfterVat(vnd("250000"));
            BigDecimal due = PaymentCalculator.amountDue(afterVat, 0);

            assertThat(due).isEqualByComparingTo(vnd("275000"));
            assertThat(PaymentCalculator.changeDue(vnd("300000"), due))
                    .isEqualByComparingTo(vnd("25000"));
            assertThat(PaymentCalculator.pointsEarned(due)).isEqualTo(2);
        }
    }
}
