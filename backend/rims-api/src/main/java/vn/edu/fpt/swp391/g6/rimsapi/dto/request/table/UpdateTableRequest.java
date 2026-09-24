package vn.edu.fpt.swp391.g6.rimsapi.dto.request.table;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class UpdateTableRequest
{
    @NotBlank(message = "Số bàn không được để trống")
    @Size(max = 20, message = "Số bàn không được vượt quá 20 ký tự")
    private String tableNumber;

    @NotNull(message = "Số chỗ ngồi không được để trống")
    @Min(value = 1, message = "Bàn phải có ít nhất 1 chỗ ngồi")
    @Max(value = 100, message = "Số chỗ ngồi không được vượt quá 100")
    private Integer capacity;

    /**
     * Bàn còn dùng hay đã cất đi.
     *
     * <p>Kiểu Boolean chứ không phải boolean: @NotNull trên boolean nguyên
     * thuỷ không bao giờ báo lỗi được, vì thiếu trường thì nó đã là false.
     */
    @NotNull(message = "Trạng thái sử dụng không được để trống")
    private Boolean active;
}
