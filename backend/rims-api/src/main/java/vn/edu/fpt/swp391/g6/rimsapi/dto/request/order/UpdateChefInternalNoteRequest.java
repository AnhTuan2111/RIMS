package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateChefInternalNoteRequest {

    @Size(
            max = 500,
            message = "Ghi chú nội bộ không được vượt quá 500 ký tự"
    )
    private String note;
}
