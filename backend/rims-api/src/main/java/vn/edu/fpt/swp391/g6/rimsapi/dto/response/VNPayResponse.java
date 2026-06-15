package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VNPayResponse {
    private String paymentUrl; // Đường link dùng để Frontend vẽ ra mã QR
    private String message;
    private boolean success;
}