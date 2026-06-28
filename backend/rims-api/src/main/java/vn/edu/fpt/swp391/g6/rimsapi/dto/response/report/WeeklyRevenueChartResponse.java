package vn.edu.fpt.swp391.g6.rimsapi.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyRevenueChartResponse {

    private LocalDate fromDate;

    private LocalDate toDate;

    private List<DailyRevenueItemResponse> items;
}
