package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class CancelDishRequest {

    @NotBlank(
            message = "Lý do hủy món không được để trống"
    )
    @Size(
            max = 500,
            message = "Lý do hủy món không được vượt quá 500 ký tự"
    )
    private String reason;
}