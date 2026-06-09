package vn.edu.fpt.swp391.g6.rimsapi.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class IntrospectResponse
{
    private boolean valid;
}
