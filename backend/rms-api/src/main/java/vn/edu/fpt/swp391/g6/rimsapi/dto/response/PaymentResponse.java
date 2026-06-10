package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.*;

@Getter
@Data
public class PaymentResponse {
    private String message;
    private boolean success;
}