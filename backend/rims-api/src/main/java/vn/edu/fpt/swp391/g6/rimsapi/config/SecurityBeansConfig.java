package vn.edu.fpt.swp391.g6.rimsapi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SecurityBeansConfig
{
    @Bean // Đăng ký bean PasswordEncoder dùng chung cho toàn bộ ứng dụng
    public PasswordEncoder passwordEncoder()
    {
        // BCrypt tự sinh salt ngẫu nhiên cho từng lần băm, nên hai người dùng
        // đặt trùng mật khẩu vẫn ra hai chuỗi băm khác nhau. Nó cũng cố ý chạy
        // chậm, khiến việc dò mật khẩu hàng loạt tốn kém.
        return new BCryptPasswordEncoder();
    }
}
