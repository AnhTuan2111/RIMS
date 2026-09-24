package vn.edu.fpt.swp391.g6.rimsapi.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Cho phép trình duyệt gọi API từ tên miền của frontend.
 *
 * <p>Frontend và backend chạy trên hai cổng khác nhau nên mọi request từ trình
 * duyệt đều là request chéo nguồn.
 */
@Configuration
public class CorsConfig
{

    /**
     * Chỉ một nguồn duy nhất, lấy từ cấu hình.
     *
     * <p>Không dùng {@code "*"}: đi kèm {@code allowCredentials(true)} thì trình
     * duyệt từ chối thẳng, và kể cả nếu được thì bất kỳ trang web nào cũng gọi
     * được API bằng phiên đăng nhập của nhân viên.
     */
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource()
    {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(frontendUrl));

        // OPTIONS có trong danh sách vì trình duyệt tự gửi request thăm dò bằng
        // phương thức này trước mọi request mang header Authorization.
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        configuration.setAllowedHeaders(List.of("*"));

        // Cần cho header Authorization đi kèm request.
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
