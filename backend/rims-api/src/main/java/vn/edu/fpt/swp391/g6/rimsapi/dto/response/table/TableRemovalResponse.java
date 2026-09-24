package vn.edu.fpt.swp391.g6.rimsapi.dto.response.table;

import lombok.Builder;
import lombok.Data;

/**
 * Kết quả của việc bỏ một bàn.
 *
 * <p>Cùng một nút bấm mà hệ thống làm hai việc khác nhau — xoá hẳn hoặc cất
 * đi — nên câu trả về phải nói rõ việc nào đã xảy ra.
 */
@Data
@Builder
public class TableRemovalResponse
{
    private boolean deleted;
    private String message;
}
