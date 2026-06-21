package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

@Data
public class UpdateCategoryRequest
{
    @NotBlank(message = "Tên danh mục không được để trống")
    @Length(max = 50, message = "Tên danh mục không được vượt quá 50 ký tự")
    private String name;
    private String description;
    
    @NotNull(message = "Trạng thái không được để trống")
    private Boolean isAvailable;  // Có thể update trạng thái
}