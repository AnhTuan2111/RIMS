package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetAccountStatusRequest
{
    private boolean active;
}
