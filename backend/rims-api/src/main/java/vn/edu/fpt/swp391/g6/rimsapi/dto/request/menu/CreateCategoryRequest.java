package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

@Data
public class CreateCategoryRequest
{

    @NotBlank(message = "Tên danh mục không được để trống")
    @Length(max = 50, message = "Tên danh mục không được vượt quá 50 ký tự")
    private String name;
    @Length(max = 100, message = "Tên danh mục kho quá 50 ký tự")
    private String description;
}