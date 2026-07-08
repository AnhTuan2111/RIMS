// src/main/java/vn/edu/fpt/swp391/g6/rimsapi/service/CustomerReservationService.java

package vn.edu.fpt.swp391.g6.rimsapi.service;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.reservation.CustomerCreateReservationRequest;
import vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation.CustomerReservationResponse;

public interface CustomerReservationService {

    /**
     * Customer đặt bàn - 1 user chỉ đặt 1 bàn
     */
    CustomerReservationResponse createReservation(CustomerCreateReservationRequest request);

    /**
     * Customer hủy đặt bàn hiện tại - Tìm theo userId
     */
    CustomerReservationResponse cancelCurrentReservation(Integer userId);

    /**
     * Kiểm tra customer đã đặt bàn trong ngày chưa
     */
    boolean checkCustomerReservationByUser(Integer userId, String date);

    /**
     * Lấy đặt bàn hiện tại của customer
     */
    CustomerReservationResponse getCurrentReservationByUser(Integer userId);
}