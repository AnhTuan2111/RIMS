package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
public class UpdateMenuStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private Boolean available;

}
