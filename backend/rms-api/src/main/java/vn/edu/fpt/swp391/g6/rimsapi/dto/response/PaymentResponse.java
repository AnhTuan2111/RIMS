package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentResponse {
    private boolean success;
    private String message;
}