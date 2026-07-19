package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.validator.constraints.Length;


@Data
public class UpdateCategoryRequest
{
    @NotBlank()
    @Length(max = 50)
    private String name;

    @Length(max = 100)
    private String description;

    @NotNull()
    private Boolean isAvailable;  // Có thể update trạng thái
}