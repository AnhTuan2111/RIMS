package vn.edu.fpt.swp391.g6.rimsapi.dto.response.reservation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeRangeResponse
{
    private LocalDateTime start;
    private LocalDateTime end;
}