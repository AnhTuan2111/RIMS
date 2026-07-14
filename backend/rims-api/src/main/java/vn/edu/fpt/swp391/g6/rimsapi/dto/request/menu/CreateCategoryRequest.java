package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.Length;


@Data
public class CreateCategoryRequest
{

    @NotBlank(message = "Tên danh mục không được để trống")
    @Length(max = 50, message = "Tên danh mục không được vượt quá 50 ký tự")
    private String name;
    @Length(max = 100, message = "Tên mô tả không quá 100 ký tự")
    private String description;
}