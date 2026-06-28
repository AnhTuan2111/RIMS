package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetAccountStatusRequest {
    private boolean active;
}
