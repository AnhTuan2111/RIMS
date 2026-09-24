package vn.edu.fpt.swp391.g6.rimsapi.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;

@DisplayName("Khung giờ nhận đặt bàn")
class ReservationWindowTest
{

    private ReservationWindow window;

    /** Ngày mai, để không phụ thuộc lúc chạy test. */
    private static final LocalDate NGAY_MAI = LocalDate.now().plusDays(1);

    @BeforeEach
    void setUp()
    {
        window = new ReservationWindow();
    }

    private static LocalDateTime luc(int gio, int phut)
    {
        return LocalDateTime.of(NGAY_MAI, LocalTime.of(gio, phut));
    }

    @Test
    @DisplayName("giữa khung giờ thì nhận")
    void giuaKhungGioThiNhan()
    {
        assertThatCode(() -> window.validate(luc(12, 30))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("đúng giờ mở cửa thì nhận")
    void dungGioMoCuaThiNhan()
    {
        assertThatCode(() -> window.validate(luc(8, 0))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("đúng giờ chốt nhận đặt thì vẫn nhận")
    void dungGioChotThiVanNhan()
    {
        assertThatCode(() -> window.validate(luc(20, 0))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("sớm hơn giờ mở cửa một phút thì từ chối")
    void somMotPhutThiTuChoi()
    {
        assertThatThrownBy(() -> window.validate(luc(7, 59)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("08:00 - 20:00");
    }

    @Test
    @DisplayName("muộn hơn giờ chốt một phút thì từ chối")
    void muonMotPhutThiTuChoi()
    {
        assertThatThrownBy(() -> window.validate(luc(20, 1)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("08:00 - 20:00");
    }

    @Test
    @DisplayName("đặt cho thời điểm đã qua thì từ chối")
    void datChoQuaKhuThiTuChoi()
    {
        assertThatThrownBy(() -> window.validate(LocalDateTime.now().minusMinutes(1)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("tương lai");
    }

    @Test
    @DisplayName("không truyền thời gian thì từ chối")
    void khongTruyenThoiGianThiTuChoi()
    {
        assertThatThrownBy(() -> window.validate(null))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("câu thông báo sinh từ chính hai mốc giờ")
    void cauThongBaoSinhTuMocGio()
    {
        assertThat(window.describe()).isEqualTo("08:00 - 20:00");
    }

}
