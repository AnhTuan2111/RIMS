package vn.edu.fpt.swp391.g6.rimsapi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
//Đây là hàm chính
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//        http
//            .csrf(AbstractHttpConfigurer::disable)
//            .cors(Customizer.withDefaults())
//            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//            .authorizeHttpRequests(auth -> auth
//                .requestMatchers("/api/auth/login").permitAll()
//                    // chỗ này ai làm feature gì mà muốn test tạm thời thì thêm dòng bên trên vào nhé, có thể thay admin = waiter, chef, cashier...  login = create, update,...
//                    // miễn là có format .requestMatchers("/api/*/*").permitAll()
//                .anyRequest().authenticated()
//            );
//
//        return http.build();
//    }


    //Đây là hàm test.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Login luôn được phép gọi
                        .requestMatchers("/api/auth/login").permitAll()

                        // Revenue Report
                        .requestMatchers("/api/reports/**").permitAll()

                        // Invoice History
                        .requestMatchers("/api/invoices/**").permitAll()

                        // Reservation Performance Score
                        .requestMatchers("/api/reservations/**").permitAll()

                        // Các API khác muốn test thì thêm vào đây
                        // .requestMatchers("/api/orders/**").permitAll()
                        // .requestMatchers("/api/reservations/**").permitAll()
                        // .requestMatchers("/api/users/**").permitAll()

                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
