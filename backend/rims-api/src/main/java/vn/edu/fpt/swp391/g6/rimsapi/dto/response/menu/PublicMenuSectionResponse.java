package vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một danh mục kèm các món của nó, cho thực đơn ở trang công khai.
 *
 * <p>Vì sao gộp sẵn theo danh mục ở backend thay vì trả một danh sách phẳng rồi
 * để trang chủ tự gom: thứ tự danh mục là một quyết định của quán, không phải
 * của trình duyệt. Trả phẳng thì mỗi lần đổi cách gom là phải sửa frontend.
 *
 * <p>Chỉ có món ĐANG BÁN và KHÔNG ẨN, trong danh mục đang bật. Khách không cần
 * biết quán có món gì đang tắt — nhìn thấy rồi gọi không được là một trải
 * nghiệm tệ hơn là không nhìn thấy.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicMenuSectionResponse
{
    private Integer categoryId;
    private String categoryName;
    private String description;
    private List<PublicMenuDish> dishes;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PublicMenuDish
    {
        private Integer dishId;
        private String name;
        private String description;
        private int price;
        private String imageUrl;
    }
}
