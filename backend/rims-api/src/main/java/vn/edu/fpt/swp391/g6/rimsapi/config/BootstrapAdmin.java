package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;

/**
 * Tạo tài khoản quản trị đầu tiên khi cơ sở dữ liệu chưa có người dùng nào.
 *
 * <p>Thay cho phần seed tài khoản của {@code DatabaseSeeder} cũ. Khác biệt nằm
 * ở chỗ lấy mật khẩu từ đâu: bản cũ gán thẳng chuỗi {@code "123456"} trong mã
 * nguồn, nên bất kỳ ai đọc repo cũng biết mật khẩu quản trị của mọi bản cài đặt.
 * Bản này đọc từ biến môi trường {@code RIMS_ADMIN_PASSWORD}.
 *
 * <p>Không có mật khẩu mà bảng users đang rỗng thì ứng dụng <b>dừng ngay lúc
 * khởi động</b>. Cố tình như vậy: một hệ thống có quản trị viên mà không ai
 * biết mật khẩu thì vô dụng, còn một hệ thống tự đặt mật khẩu đoán được thì
 * nguy hiểm. Bắt người cài đặt quyết định là lựa chọn duy nhất còn lại.
 *
 * <p>Tài khoản tạo ra mang cờ {@code mustChangePassword}, nên người cài đặt
 * phải đổi ngay ở lần đăng nhập đầu — mật khẩu đặt qua biến môi trường vẫn
 * nằm trong lịch sử shell và file cấu hình triển khai.
 *
 * <p>Đã có người dùng thì không làm gì cả, kể cả khi biến môi trường đổi.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BootstrapAdmin implements CommandLineRunner
{
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-username:admin}")
    private String username;

    @Value("${app.bootstrap.admin-full-name:Quản trị viên}")
    private String fullName;

    @Value("${app.bootstrap.admin-email:}")
    private String email;

    @Value("${app.bootstrap.admin-phone:0900000001}")
    private String phone;

    @Value("${app.bootstrap.admin-password:}")
    private String password;

    @Override
    public void run(String... args)
    {
        if (userRepository.count() > 0)
        {
            return;
        }

        if (password == null || password.isBlank())
        {
            throw new IllegalStateException("""
                    Cơ sở dữ liệu chưa có người dùng nào và chưa đặt mật khẩu quản trị đầu tiên.

                    Đặt biến môi trường RIMS_ADMIN_PASSWORD rồi khởi động lại, ví dụ:
                        RIMS_ADMIN_PASSWORD=<mật khẩu bạn chọn>

                    Hoặc thêm RIMS_ADMIN_PASSWORD vào file .env ở gốc repo.

                    Tài khoản tạo ra sẽ bị bắt đổi mật khẩu ngay ở lần đăng nhập đầu.""");
        }

        User admin = new User();

        admin.setRole(RoleType.ADMIN);
        admin.setUsername(username);
        admin.setFullName(fullName);
        admin.setEmail(email == null || email.isBlank() ? null : email);
        admin.setPhone(phone);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setMustChangePassword(true);
        admin.setActive(true);

        userRepository.save(admin);

        log.info("Đã tạo tài khoản quản trị đầu tiên \"{}\". Đăng nhập lần đầu sẽ bị bắt đổi mật khẩu.",
                username);
    }
}
