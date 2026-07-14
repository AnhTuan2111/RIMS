package vn.edu.fpt.swp391.g6.rimsapi.util;

import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.Reservation;
import vn.edu.fpt.swp391.g6.rimsapi.enums.ReservationStatus;

import java.time.LocalDateTime;
import java.util.List;


@Component
public class ReservationConflictValidator
{

    public static final int TABLE_TURNAROUND_MINUTES = 150;

    public boolean hasConflict(List<Reservation> existingReservations,
                               LocalDateTime requestedTime,
                               Long excludeReservationId)
    {
        LocalDateTime start = requestedTime.minusMinutes(TABLE_TURNAROUND_MINUTES);
        LocalDateTime end = requestedTime.plusMinutes(TABLE_TURNAROUND_MINUTES);

        for (Reservation res : existingReservations)
        {
            if (res.getStatus() != ReservationStatus.CANCELLED)
            {
                if (excludeReservationId != null && excludeReservationId.equals(res.getId()))
                {
                    continue;
                }
                if (res.getReservationTime().isAfter(start) && res.getReservationTime().isBefore(end))
                {
                    return true;
                }
            }
        }
        return false;
    }
}
