package vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu;

import lombok.Data;

import java.time.LocalDateTime;


@Data
public class DishResponse
{
    private Integer id;
    private String name;
    private String description;
    private Integer price;
    private Boolean isAvailable;
    private String imageUrl;
    private String categoryName;
    private Integer categoryId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}