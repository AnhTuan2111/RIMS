// src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/CustomerReservationService.java

package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation.CustomerCreateReservationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.CustomerReservationResponse;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.RestaurantTableResponse;

import java.util.List;

public interface CustomerService
{

    /**
     * Customer đặt bàn - 1 user chỉ đặt 1 bàn
     */
    CustomerReservationResponse createReservation(CustomerCreateReservationRequest request);

    /**
     * Customer hủy đặt bàn - nhận cả userId (check ownership) và reservationId (đặt bàn cụ thể cần hủy)
     * Không còn tự lấy "đặt bàn gần nhất" nữa vì có thể hủy nhầm nếu user có nhiều active reservation
     */
    CustomerReservationResponse cancelReservation(Integer userId, Long reservationId);

    /**
     * Kiểm tra customer đã đặt bàn trong ngày chưa
     */
    boolean checkCustomerReservationByUser(Integer userId, String date);

    /**
     * Lấy đặt bàn hiện tại của customer
     */
    CustomerReservationResponse getCurrentReservationByUser(Integer userId);

    /**
     * Lấy danh sách bàn còn trống để customer chọn khi đặt bàn
     */
    List<RestaurantTableResponse> getAvailableTables();
}