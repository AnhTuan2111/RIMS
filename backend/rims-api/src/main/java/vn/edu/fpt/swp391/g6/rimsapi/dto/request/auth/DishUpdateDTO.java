package vn.edu.fpt.swp391.g6.rimsapi.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.hibernate.validator.constraints.Length;

@Data
public class DishUpdateDTO {

    @NotBlank(message = "Tên món ăn không được để trống")
    @Length(max = 50, message = "Tên món ăn không được vượt quá 50 ký tự")
    private String name;

    private String description;

    @Positive(message = "Giá phải lớn hơn 0")
    private Integer price;

    private String imageUrl;

    private Boolean isAvailable;  // Có thể update trạng thái

    private Integer categoryId;  // Có thể chuyển danh mục
}