package vn.edu.fpt.swp391.g6.rimsapi.util;

import static org.assertj.core.api.Assertions.assertThat;
import static vn.edu.fpt.swp391.g6.rimsapi.util.ReservationConflictValidator.TABLE_TURNAROUND_MINUTES;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;

@DisplayName("Kiểm tra trùng lịch đặt bàn")
class ReservationConflictValidatorTest
{

    /** 19h00 một ngày cố định, để test không phụ thuộc lúc chạy. */
    private static final LocalDateTime BAY_GIO = LocalDateTime.of(2026, 3, 14, 19, 0);

    private ReservationConflictValidator validator;

    @BeforeEach
    void setUp()
    {
        validator = new ReservationConflictValidator();
    }

    private static Reservation datBan(long id, LocalDateTime luc, ReservationStatus status)
    {
        Reservation r = new Reservation();
        r.setId(id);
        r.setReservationTime(luc);
        r.setStatus(status);
        return r;
    }

    private static Reservation datBan(long id, LocalDateTime luc)
    {
        return datBan(id, luc, ReservationStatus.QUEUED);
    }

    @Nested
    @DisplayName("Trùng với lượt đặt khác")
    class TrungLuotDat
    {

        @Test
        @DisplayName("bàn chưa ai đặt thì luôn nhận")
        void banTrongThiNhan()
        {
            assertThat(validator.hasConflict(List.of(), BAY_GIO, null, null)).isFalse();
        }

        @Test
        @DisplayName("đặt trùng đúng giờ người khác thì từ chối")
        void trungDungGioThiTuChoi()
        {
            List<Reservation> co = List.of(datBan(1, BAY_GIO));

            assertThat(validator.hasConflict(co, BAY_GIO, null, null)).isTrue();
        }

        @Test
        @DisplayName("cách nhau đúng bằng thời gian xoay bàn thì nhận")
        void dungThoiGianXoayBanThiNhan()
        {
            List<Reservation> co = List.of(datBan(1, BAY_GIO));

            assertThat(validator.hasConflict(
                    co, BAY_GIO.plusMinutes(TABLE_TURNAROUND_MINUTES), null, null)).isFalse();

            assertThat(validator.hasConflict(
                    co, BAY_GIO.minusMinutes(TABLE_TURNAROUND_MINUTES), null, null)).isFalse();
        }

        @Test
        @DisplayName("thiếu một phút so với thời gian xoay bàn thì từ chối")
        void thieuMotPhutThiTuChoi()
        {
            List<Reservation> co = List.of(datBan(1, BAY_GIO));

            assertThat(validator.hasConflict(
                    co, BAY_GIO.plusMinutes(TABLE_TURNAROUND_MINUTES - 1), null, null)).isTrue();

            assertThat(validator.hasConflict(
                    co, BAY_GIO.minusMinutes(TABLE_TURNAROUND_MINUTES - 1), null, null)).isTrue();
        }

        @Test
        @DisplayName("lượt đã huỷ không chặn ai")
        void luotDaHuyKhongChan()
        {
            List<Reservation> co = List.of(
                    datBan(1, BAY_GIO, ReservationStatus.CANCELLED));

            assertThat(validator.hasConflict(co, BAY_GIO, null, null)).isFalse();
        }

        @Test
        @DisplayName("lượt đang chờ, đang phục vụ và đã xong đều chặn")
        void cacTrangThaiConHieuLucDeuChan()
        {
            for (ReservationStatus st : List.of(ReservationStatus.QUEUED,
                    ReservationStatus.WAITING,
                    ReservationStatus.COMPLETED))
            {
                assertThat(validator.hasConflict(
                        List.of(datBan(1, BAY_GIO, st)), BAY_GIO, null, null))
                        .as("trạng thái %s phải chặn", st)
                        .isTrue();
            }
        }

        @Test
        @DisplayName("chỉ cần một lượt trùng trong danh sách là từ chối")
        void motLuotTrungLaDu()
        {
            List<Reservation> co = List.of(
                    datBan(1, BAY_GIO.minusHours(6)),
                    datBan(2, BAY_GIO.plusMinutes(30)),
                    datBan(3, BAY_GIO.plusHours(6)));

            assertThat(validator.hasConflict(co, BAY_GIO, null, null)).isTrue();
        }
    }

    @Nested
    @DisplayName("Sửa lượt đặt sẵn có")
    class SuaLuotDat
    {

        @Test
        @DisplayName("sửa giờ của chính lượt đó thì không tự chặn mình")
        void khongTuChanMinh()
        {
            List<Reservation> co = List.of(datBan(7, BAY_GIO));

            assertThat(validator.hasConflict(co, BAY_GIO.plusMinutes(30), 7L, null))
                    .isFalse();
        }

        @Test
        @DisplayName("vẫn chặn nếu đụng lượt của người khác")
        void vanChanLuotNguoiKhac()
        {
            List<Reservation> co = List.of(
                    datBan(7, BAY_GIO),
                    datBan(8, BAY_GIO.plusMinutes(40)));

            assertThat(validator.hasConflict(co, BAY_GIO.plusMinutes(30), 7L, null))
                    .isTrue();
        }
    }

    @Nested
    @DisplayName("Bàn đang có khách ngồi")
    class BanDangPhucVu
    {

        @Test
        @DisplayName("khách mới vào thì chưa nhận đặt")
        void khachMoiVaoThiChuaNhan()
        {
            assertThat(validator.hasConflict(
                    List.of(), BAY_GIO, null, BAY_GIO.minusMinutes(10))).isTrue();
        }

        @Test
        @DisplayName("khách ngồi đủ lâu thì nhận đặt tiếp")
        void ngoiDuLauThiNhan()
        {
            assertThat(validator.hasConflict(
                    List.of(), BAY_GIO, null,
                    BAY_GIO.minusMinutes(TABLE_TURNAROUND_MINUTES))).isFalse();
        }

        @Test
        @DisplayName("thiếu một phút thì vẫn chưa nhận")
        void thieuMotPhutThiChua()
        {
            assertThat(validator.hasConflict(
                    List.of(), BAY_GIO, null,
                    BAY_GIO.minusMinutes(TABLE_TURNAROUND_MINUTES - 1))).isTrue();
        }

        @Test
        @DisplayName("bàn không có khách thì không xét điều kiện này")
        void banTrongThiBoQua()
        {
            assertThat(validator.hasConflict(List.of(), BAY_GIO, null, null)).isFalse();
        }

        @Test
        @DisplayName("đặt cho ngày mai thì bàn đang có khách hôm nay không ảnh hưởng")
        void datNgayMaiThiKhongAnhHuong()
        {
            assertThat(validator.hasConflict(
                    List.of(), BAY_GIO.plusDays(1), null, BAY_GIO)).isFalse();
        }
    }
}
