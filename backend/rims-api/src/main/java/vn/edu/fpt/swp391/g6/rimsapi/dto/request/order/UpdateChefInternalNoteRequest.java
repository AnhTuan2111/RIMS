package vn.edu.fpt.swp391.g6.rimsapi.dto.request.order;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateChefInternalNoteRequest {

    @Size(max = 100)
    private String note;
}
