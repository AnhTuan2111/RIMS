package vn.edu.fpt.swp391.g6.rimsapi.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DishListResponse {

    private Integer dishId;

    private String dishName;

    private String category;

    private Integer price;

    private Boolean available;

}