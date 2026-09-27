package vn.edu.fpt.swp391.g6.rimsapi.dto.response.table;

import lombok.Builder;
import lombok.Data;

/**
 * Một bàn nhìn từ màn Quản lý bàn.
 *
 * <p>Khác {@code RestaurantTableResponse} của màn đặt bàn: ở đây quản lý cần
 * biết bàn đã dính vào bao nhiêu đơn và lần đặt, vì đó là thứ quyết định bàn
 * xoá được hay chỉ cất đi được.
 */
@Data
@Builder
public class AdminTableResponse
{
    private Integer id;
    private String tableNumber;
    private Integer capacity;

    /** Tình trạng lúc này: AVAILABLE, RESERVED, SERVING. */
    private String status;

    /** Còn nằm trong sơ đồ bàn hay đã cất đi. */
    private boolean active;

    private long orderCount;
    private long reservationCount;

    /** Chưa từng dùng thì mới xoá hẳn được; đã dùng rồi thì chỉ cất đi. */
    private boolean deletable;

    /**
     * Chỗ đứng trên sơ đồ mặt bằng, tính bằng ô lưới.
     *
     * <p>NULL nghĩa là bàn chưa được đặt chỗ — sơ đồ xếp những bàn đó thành
     * hàng ở cuối thay vì dồn tất cả vào góc (0,0).
     */
    private Integer layoutX;
    private Integer layoutY;
    private Integer layoutW;
    private Integer layoutH;

    /** Khu vực do quản lý đặt tên: "Tầng 1", "Sân vườn". */
    private String zone;
}
