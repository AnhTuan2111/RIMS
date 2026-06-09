package vn.edu.fpt.swp391.g6.rimsapi.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class IntrospectRequest
{
    private String token;
    private boolean authenticated;
}
