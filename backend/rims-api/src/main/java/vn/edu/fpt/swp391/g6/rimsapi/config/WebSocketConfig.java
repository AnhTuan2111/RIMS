package vn.edu.fpt.swp391.g6.rimsapi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Tạo ra một trạm phát sóng có tên là "/topic"
        // Frontend sẽ "đăng ký" (subscribe) vào đây để hóng tin tức
        config.enableSimpleBroker("/topic");

        // (Tùy chọn) Prefix cho các message từ Frontend gửi lên Backend
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Tạo một cổng kết nối tên là "/ws-rims" cho React gọi vào
        registry.addEndpoint("/ws-rims")
                .setAllowedOriginPatterns("*") // Cho phép React kết nối
                .withSockJS(); // Fallback an toàn nếu trình duyệt cũ không hỗ trợ chuẩn WebSocket
    }
}