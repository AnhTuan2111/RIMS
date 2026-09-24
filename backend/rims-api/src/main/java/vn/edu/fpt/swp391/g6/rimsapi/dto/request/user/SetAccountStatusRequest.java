package vn.edu.fpt.swp391.g6.rimsapi.dto.request.user;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetAccountStatusRequest
{
    /*
     * Boolean chứ không phải boolean: @NotNull trên kiểu nguyên thuỷ không có
     * tác dụng vì nó không bao giờ null, mặc định là false. Gửi body rỗng sẽ
     * âm thầm KHOÁ tài khoản thay vì báo lỗi.
     */
    @NotNull(message = "Trạng thái kích hoạt không được để trống")
    private Boolean active;
}
