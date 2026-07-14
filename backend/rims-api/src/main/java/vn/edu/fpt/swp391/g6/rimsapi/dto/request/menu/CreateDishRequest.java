package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.hibernate.validator.constraints.Length;


@Data
public class CreateDishRequest
{

    @NotBlank(message = "Tên món ăn không được để trống")
    @Length(max = 50, message = "Tên món ăn không được vượt quá 50 ký tự")
    private String name;

    @Length(max = 100, message = "Tên mô tả không vượt quá 100 ký tự")
    private String description;

    @NotNull(message = "Giá không được để trống")
    @Positive(message = "Giá phải lớn hơn 0")
    private Integer price;

    private String imageUrl;

    private Boolean isAvailable = true;

    @NotNull(message = "Vui lòng chọn danh mục món ăn")
    private Integer categoryId;
}