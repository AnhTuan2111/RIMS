package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import vn.edu.fpt.swp391.g6.rimsapi.security.JwtAccessDeniedHandler;
import vn.edu.fpt.swp391.g6.rimsapi.security.JwtAuthenticationEntryPoint;
import vn.edu.fpt.swp391.g6.rimsapi.security.JwtAuthenticationFilter;
import vn.edu.fpt.swp391.g6.rimsapi.security.MustChangePasswordFilter;

/**
 * Luật bảo mật cho toàn bộ API.
 *
 * <p>Phân quyền làm ở mức đường dẫn: mỗi vai trò có một tiền tố riêng. Quyền
 * theo từng bản ghi (khách A không xem được đặt bàn của khách B) nằm trong
 * service, vì chỉ ở đó mới biết bản ghi thuộc về ai.
 */
@Configuration
@EnableWebSecurity
// Bật sẵn @PreAuthorize ở tầng phương thức cho khi cần quyền chi tiết hơn.
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig
{
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final MustChangePasswordFilter mustChangePasswordFilter;

    /** Không có token hoặc token sai: trả 401. */
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    /** Có token nhưng sai vai trò: trả 403. */
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http)
    {
        http
                // API dùng JWT trong header, không dùng cookie phiên, nên không có
                // bề mặt tấn công CSRF để mà phòng.
                .csrf(AbstractHttpConfigurer::disable)

                // Đọc cấu hình từ bean CorsConfigurationSource trong CorsConfig.
                .cors(Customizer.withDefaults())

                // Không giữ phiên trên server: mỗi request tự mang JWT của nó.
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Trả JSON lỗi thay vì trang đăng nhập mặc định của Spring.
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler))

                // Xét theo thứ tự từ trên xuống, khớp luật nào thì dừng ở luật đó.
                .authorizeHttpRequests(auth -> auth

                        // VNPay gọi thẳng vào từ máy chủ của họ nên không thể đính
                        // kèm JWT của khách. Tính toàn vẹn dựa vào chữ ký HMAC
                        // trong tham số, kiểm ở VNPayConfig.
                        .requestMatchers("/rims/cashier/payments/vnpay-callback").permitAll()

                        // Người dùng chưa đăng nhập lúc gọi những đường dẫn này.
                        .requestMatchers(
                                "/rims/auth/register",
                                "/rims/auth/login",
                                "/rims/auth/logout",
                                "/rims/auth/refresh",
                                "/rims/auth/forgot-password",
                                "/rims/auth/reset-password")
                        .permitAll()

                        // WebSocket xác thực ở tầng STOMP qua
                        // StompAuthChannelInterceptor, không qua filter HTTP.
                        .requestMatchers("/ws-rims/**").permitAll()

                        // Trang chủ và thực đơn công khai: khách chưa có tài khoản
                        // vẫn phải xem được.
                        .requestMatchers("/rims/public/**").permitAll()

                        .requestMatchers("/rims/admin/**").hasRole("ADMIN")
                        .requestMatchers("/rims/chef/**").hasRole("CHEF")
                        .requestMatchers("/rims/waiter/**").hasRole("WAITER")
                        .requestMatchers("/rims/cashier/**").hasRole("CASHIER")
                        .requestMatchers("/rims/customer/**").hasRole("CUSTOMER")

                        // Đường dẫn mới thêm mà quên khai báo thì mặc định là phải
                        // đăng nhập, chứ không phải mở cho tất cả.
                        .anyRequest().authenticated())

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Phải nằm SAU filter JWT vì nó đọc principal do filter kia đặt vào
                // SecurityContext.
                .addFilterAfter(mustChangePasswordFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
