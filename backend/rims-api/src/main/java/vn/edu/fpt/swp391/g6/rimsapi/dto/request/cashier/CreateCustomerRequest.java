package vn.edu.fpt.swp391.g6.rimsapi.dto.request.cashier;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

/**
 * Tạo nhanh tài khoản khách vãng lai ngay tại quầy.
 *
 * <p>Trước đây endpoint này nhận thẳng một {@code Map<String, String>} nên không
 * có ràng buộc nào: thiếu số điện thoại thì tạo ra tài khoản có username rỗng,
 * và số điện thoại sai định dạng vẫn lọt vào cơ sở dữ liệu.
 */
@Getter
@Setter
public class CreateCustomerRequest
{
    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không quá 100 ký tự")
    private String fullName;

    /** Số điện thoại vừa là danh tính khách vừa là tên đăng nhập của họ. */
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "0\\d{9}", message = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0")
    private String phone;

    /** Bắt buộc: đây là đường lấy lại mật khẩu duy nhất của tài khoản. */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 50, message = "Email không quá 50 ký tự")
    private String email;
}
