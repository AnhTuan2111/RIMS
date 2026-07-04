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


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig
{

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception
    {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/rims/cashier/payments/vnpay-callback").permitAll()
                        .requestMatchers(
                                "/rims/auth/login",
                                "/rims/auth/logout",
                                "/rims/auth/refresh",
                                "/rims/auth/forgot-password",
                                "/rims/auth/reset-password"
                        ).permitAll()
                        .requestMatchers("/ws-rims/**").permitAll()
                        .requestMatchers("/rims/admin/**").hasRole("ADMIN")
                        .requestMatchers("/rims/chef/**").hasRole("CHEF")
                        .requestMatchers("/rims/waiter/**").hasRole("WAITER")
                        .requestMatchers("/rims/cashier/**").hasRole("CASHIER")
                        .requestMatchers("/rims/customer/**").hasRole("CUSTOMER")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
