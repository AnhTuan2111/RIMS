package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.hibernate.validator.constraints.Length;


@Data
public class UpdateDishRequest
{

    @NotBlank(message = "Tên món ăn không được để trống")
    @Length(max = 50, message = "Tên món ăn không được vượt quá 50 ký tự")
    private String name;
    @Length(max = 150, message = "Tên mô tả không quá 150 ký tự")
    private String description;

    @NotNull(message = "Giá không được để trống")
    @Positive(message = "Giá phải lớn hơn 0")
    private Integer price;

    private String imageUrl;

    @NotNull(message = "Trạng thái không được để trống")
    private Boolean isAvailable;  // Có thể update trạng thái

    private Boolean isHidden;

    @NotNull(message = "Vui lòng chọn danh mục món ăn")
    private Integer categoryId;  // Có thể chuyển danh mục
}