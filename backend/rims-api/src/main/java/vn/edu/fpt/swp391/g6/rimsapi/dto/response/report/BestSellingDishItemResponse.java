package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class BestSellingDishItemResponse
{

    private Integer rank;

    private String dishName;

    private Long totalQuantity;

    private BigDecimal totalRevenue;
}