package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RestaurantTable;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;
import vn.edu.fpt.swp391.g6.rimsapi.enums.TableStatus;
import vn.edu.fpt.swp391.g6.rimsapi.repository.ReservationRepository;
import vn.edu.fpt.swp391.g6.rimsapi.repository.RestaurantTableRepository;
import vn.edu.fpt.swp391.g6.rimsapi.util.WebSocketBroadcaster;

/**
 * Giữ bàn cho lượt đặt sắp tới.
 *
 * <p>Luật cũ: bàn đã đặt còn khách và không còn bàn nào đủ chỗ thì HUỶ lượt
 * đặt, không báo ai. Luật mới: giữ lượt đặt, đánh dấu, và báo phục vụ xử lý.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Giữ bàn cho lượt đặt sắp tới")
class ReservationHoldTest
{

    @Mock
    private RestaurantTableRepository restaurantTableRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private WebSocketBroadcaster webSocketBroadcaster;

    @InjectMocks
    private WaiterServiceImpl service;

    private RestaurantTable booked;
    private Reservation reservation;

    @BeforeEach
    void setUp()
    {
        booked = table(13, "B13", 6, TableStatus.SERVING);

        reservation = new Reservation();
        reservation.setId(25L);
        reservation.setCustomerName("Khách đến");
        reservation.setStatus(ReservationStatus.QUEUED);
        reservation.setReservationTime(LocalDateTime.now().plusMinutes(20));
        reservation.setTable(booked);

        lenient().when(restaurantTableRepository.findByIdForUpdate(13)).thenReturn(Optional.of(booked));
        lenient().when(reservationRepository.findByStatusAndReservationTimeBetween(
                eq(ReservationStatus.QUEUED), any(), any())).thenReturn(List.of(reservation));
    }

    private static RestaurantTable table(int id, String number, int capacity, TableStatus status)
    {
        RestaurantTable t = new RestaurantTable();
        t.setId(id);
        t.setTableNumber(number);
        t.setCapacity(capacity);
        t.setStatus(status);
        t.setActive(true);
        return t;
    }

    private void alternatives(RestaurantTable... tables)
    {
        when(restaurantTableRepository.findByActiveTrueAndStatusAndCapacityGreaterThanEqual(
                eq(TableStatus.AVAILABLE), anyInt())).thenReturn(new ArrayList<>(List.of(tables)));
    }

    @Test
    @DisplayName("bàn đã đặt đang trống thì giữ đúng bàn đó")
    void banTrongThiGiu()
    {
        booked.setStatus(TableStatus.AVAILABLE);

        service.autoUpdateTableStatusToReserved();

        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.WAITING);
        assertThat(booked.getStatus()).isEqualTo(TableStatus.RESERVED);
        assertThat(reservation.isNeedsAttention()).isFalse();
    }

    @Test
    @DisplayName("bàn còn khách mà có bàn khác đủ chỗ thì chuyển sang bàn nhỏ nhất vừa đủ")
    void coBanKhacThiChuyen()
    {
        RestaurantTable big = table(20, "B20", 10, TableStatus.AVAILABLE);
        RestaurantTable fit = table(14, "B14", 6, TableStatus.AVAILABLE);
        alternatives(big, fit);

        service.autoUpdateTableStatusToReserved();

        assertThat(reservation.getTable()).isSameAs(fit);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.WAITING);
        assertThat(fit.getStatus()).isEqualTo(TableStatus.RESERVED);
        assertThat(big.getStatus()).isEqualTo(TableStatus.AVAILABLE);
    }

    @Test
    @DisplayName("không còn bàn nào đủ chỗ thì KHÔNG huỷ — đánh dấu và báo phục vụ")
    void hetBanThiBaoPhucVu()
    {
        alternatives();

        service.autoUpdateTableStatusToReserved();

        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.QUEUED);
        assertThat(reservation.isNeedsAttention()).isTrue();
        verify(webSocketBroadcaster).broadcastAfterCommit("/topic/waiter", "RESERVATION_ATTENTION");
    }

    @Test
    @DisplayName("đã báo rồi mà vẫn chưa có bàn thì không báo lại mỗi phút")
    void khongBaoLai()
    {
        reservation.setNeedsAttention(true);
        alternatives();

        service.autoUpdateTableStatusToReserved();

        assertThat(reservation.isNeedsAttention()).isTrue();
        verify(webSocketBroadcaster, never()).broadcastAfterCommit(eq("/topic/waiter"), any());
    }

    @Test
    @DisplayName("bàn trống trở lại thì tự giữ bàn và gỡ dấu")
    void banTrongLaiThiTuGo()
    {
        reservation.setNeedsAttention(true);
        booked.setStatus(TableStatus.AVAILABLE);

        service.autoUpdateTableStatusToReserved();

        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.WAITING);
        assertThat(reservation.isNeedsAttention()).isFalse();
        verify(webSocketBroadcaster).broadcastAfterCommit("/topic/tables", "TABLE_UPDATED");
    }

    @Test
    @DisplayName("bàn đang giữ cho lượt khác cũng được xử lý, không bị bỏ quên")
    void banDangGiuChoLuotKhac()
    {
        booked.setStatus(TableStatus.RESERVED);
        alternatives();

        service.autoUpdateTableStatusToReserved();

        assertThat(reservation.isNeedsAttention()).isTrue();
    }
}
