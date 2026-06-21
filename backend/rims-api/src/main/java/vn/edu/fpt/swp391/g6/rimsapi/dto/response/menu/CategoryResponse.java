package vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CategoryResponse
{
    private Integer id;
    private String name;
    private String description;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}