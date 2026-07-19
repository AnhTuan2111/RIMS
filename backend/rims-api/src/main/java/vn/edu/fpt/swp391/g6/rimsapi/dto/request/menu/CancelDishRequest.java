package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class CancelDishRequest {

    @NotBlank()
    @Size(max = 100)
    private String reason;
}