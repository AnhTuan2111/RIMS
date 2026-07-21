package vn.edu.fpt.swp391.g6.rimsapi.dto.request.menu;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.hibernate.validator.constraints.Length;


@Data
public class CreateDishRequest
{
    @NotBlank()
    @Length(max = 50)
    private String name;

    @Length(max = 100)
    private String description;

    @NotNull
    @Positive()
    private Integer price;

    private String imageUrl;

    private Boolean isAvailable = true;

    private Boolean isHidden = false;

    @NotNull()
    private Integer categoryId;
}