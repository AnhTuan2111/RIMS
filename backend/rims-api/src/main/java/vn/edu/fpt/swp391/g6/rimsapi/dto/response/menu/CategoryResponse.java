package vn.edu.fpt.swp391.g6.rimsapi.dto.response.menu;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CategoryResponse
{
    private Integer id;
    private String name;
    private String description;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Số món thuộc danh mục, kể cả món đang ẩn.
     *
     * <p>Trước đây màn Quản lý danh mục tự đếm bằng cách lọc danh sách món theo
     * TÊN danh mục. Hai tổ hợp lệch nhau: danh sách món có thể không chứa món đang
     * ẩn, và ghép theo tên thì đổi tên danh mục là đếm sai.
     */
    private long dishCount;
}
