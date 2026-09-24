package vn.edu.fpt.swp391.g6.rimsapi.dto.request.table;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class CreateTableRequest
{
    @NotBlank(message = "Số bàn không được để trống")
    @Size(max = 20, message = "Số bàn không được vượt quá 20 ký tự")
    private String tableNumber;

    /**
     * Số chỗ ngồi.
     *
     * <p>Không chặn ở một con số tròn nào: nhà hàng có bàn tiệc 20 chỗ thì cứ
     * nhập 20. Trần 100 chỉ để chặn lỗi gõ nhầm thêm số 0.
     */
    @NotNull(message = "Số chỗ ngồi không được để trống")
    @Min(value = 1, message = "Bàn phải có ít nhất 1 chỗ ngồi")
    @Max(value = 100, message = "Số chỗ ngồi không được vượt quá 100")
    private Integer capacity;
}
