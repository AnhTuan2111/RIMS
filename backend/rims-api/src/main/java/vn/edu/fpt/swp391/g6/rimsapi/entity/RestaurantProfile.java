package vn.edu.fpt.swp391.g6.rimsapi.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Thông tin nhận diện của nhà hàng, do quản trị viên tự cấu hình.
 *
 * <p>Trước đây tên nhà hàng, mô tả và định hướng ẩm thực bị viết cứng trong mã nguồn
 * frontend (HomePage, LoginPage), nên muốn dùng app cho một quán khác là phải sửa code
 * rồi build lại. Đưa vào DB để một bản cài đặt phục vụ được bất kỳ nhà hàng nào.
 *
 * <p>Bảng này luôn chỉ có ĐÚNG MỘT dòng, id = 1. Không có API tạo mới hay xoá; chỉ đọc
 * và cập nhật. Nếu chưa có dòng nào, service tự tạo bản mặc định.
 */
@Entity
@Table(name = "restaurant_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantProfile
{

    /** Luôn bằng 1. Bảng cấu hình một dòng nên không cần khoá tự tăng thật sự. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120)
    private String name;

    /** Câu mô tả ngắn hiện dưới tên, ví dụ "Ẩm thực Nhật Bản đương đại". */
    @Column(length = 200)
    private String tagline;

    @Column(length = 2000)
    private String description;

    /** Đường dẫn ảnh logo. Để trống thì giao diện hiện chữ cái đầu của tên. */
    @Column(length = 500)
    private String logoUrl;

    /** Ảnh lớn dùng cho trang chủ. */
    @Column(length = 500)
    private String heroImageUrl;

    @Column(length = 200)
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(length = 120)
    private String email;

    /** Giờ mở cửa dạng chữ cho người đọc, ví dụ "10:00 - 22:00 hằng ngày". */
    @Column(length = 120)
    private String openingHours;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touchUpdatedAt()
    {
        updatedAt = LocalDateTime.now();
    }
}
