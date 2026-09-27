package vn.edu.fpt.swp391.g6.rimsapi.dto.request.table;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;

/**
 * Chỗ đứng của từng bàn trên sơ đồ mặt bằng.
 *
 * <p>Gửi CẢ SƠ ĐỒ trong một lần, không gửi từng bàn một. Kéo thả sinh ra hàng
 * chục lần đổi chỗ trong vài giây; gửi từng bàn thì thứ tự tới nơi không còn
 * chắc chắn và sơ đồ lưu xong có thể khác sơ đồ trên màn hình.
 *
 * <p>Bàn KHÔNG có trong danh sách gửi lên sẽ bị xoá chỗ (về NULL): quản lý kéo
 * một bàn ra khỏi mặt bằng thì đó là ý định, không phải thiếu sót.
 */
@Data
public class SaveLayoutRequest
{
    @NotEmpty(message = "Sơ đồ phải có ít nhất một bàn")
    @Valid
    private List<TableSlot> tables;

    @Data
    public static class TableSlot
    {
        @NotNull(message = "Thiếu mã bàn")
        private Integer tableId;

        /**
         * Toạ độ tính bằng Ô LƯỚI, không phải pixel.
         *
         * <p>Trần 200×200 ô là để chặn số rác, không phải giới hạn nghiệp vụ:
         * một mặt bằng 200 ô mỗi chiều đã lớn hơn mọi quán mà app này phục vụ.
         */
        @NotNull
        @Min(value = 0, message = "Toạ độ không được âm")
        @Max(value = 200, message = "Toạ độ vượt quá khổ mặt bằng")
        private Integer x;

        @NotNull
        @Min(value = 0, message = "Toạ độ không được âm")
        @Max(value = 200, message = "Toạ độ vượt quá khổ mặt bằng")
        private Integer y;

        @NotNull
        @Min(value = 1, message = "Bàn phải rộng ít nhất một ô")
        @Max(value = 20, message = "Bàn rộng quá khổ")
        private Integer w;

        @NotNull
        @Min(value = 1, message = "Bàn phải cao ít nhất một ô")
        @Max(value = 20, message = "Bàn cao quá khổ")
        private Integer h;

        @Size(max = 50, message = "Tên khu vực tối đa 50 ký tự")
        private String zone;
    }
}
