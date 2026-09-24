package vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu;

import lombok.Builder;
import lombok.Getter;

/**
 * Kết quả của thao tác xoá danh mục.
 *
 * <p>Cùng một nút bấm nhưng hệ thống làm hai việc khác nhau tuỳ danh mục còn
 * món hay không, nên phải nói rõ việc nào đã xảy ra — không thì người dùng
 * tưởng đã xoá hẳn trong khi thực tế chỉ ẩn đi.
 */
@Getter
@Builder
public class CategoryRemovalResponse
{

    /** true: đã xoá khỏi cơ sở dữ liệu. false: chỉ ẩn khỏi thực đơn. */
    private boolean deleted;

    /** Số món bị ẩn theo. Bằng 0 khi danh mục bị xoá hẳn. */
    private int hiddenDishCount;

    /** Câu để hiện thẳng cho người dùng. */
    private String message;
}
