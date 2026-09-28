package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import vn.edu.fpt.swp391.g6.rimsapi.service.EmailService;

/**
 * Gửi OTP qua HTTP API của Brevo, dùng khi deploy.
 *
 * <p>VÌ SAO KHÔNG DÙNG SMTP Ở ĐÂY: các gói lưu trữ miễn phí thường chặn traffic
 * đi ra ở cổng 25, 465 và 587 để máy chủ của họ không bị dùng làm nơi phát tán
 * thư rác. Render nói rõ điều này cho gói free. Hệ quả là
 * {@link SmtpEmailServiceImpl} sẽ hỏng ở đó, và hỏng đúng vào luồng quên mật
 * khẩu — thứ người dùng chỉ cần đến khi đã không vào được tài khoản.
 *
 * <p>API này chỉ là một request HTTPS tới cổng 443 nên không vướng gì. Gói miễn
 * phí của Brevo cho 300 thư/ngày và cho phép xác minh một địa chỉ gửi bằng mã
 * 6 số gửi vào chính hộp thư đó, nên không cần sở hữu tên miền.
 *
 * <p>Bật bằng {@code app.mail.provider=brevo}.
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "brevo")
@Slf4j
public class BrevoEmailServiceImpl implements EmailService
{

    private static final String ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private final RestClient restClient;
    private final String senderEmail;
    private final String senderName;

    public BrevoEmailServiceImpl(
            @Value("${app.mail.brevo.api-key:}") String apiKey,
            @Value("${app.mail.from-email:}") String senderEmail,
            @Value("${app.mail.from-name:RIMS}") String senderName)
    {
        // Dừng ngay lúc khởi động thay vì để lỗi nổ ra ở lần đầu có người bấm
        // "Quên mật khẩu" — lúc đó thì không ai còn nối được nguyên nhân với
        // một biến môi trường bỏ trống từ hôm deploy.
        if (apiKey == null || apiKey.isBlank())
        {
            throw new IllegalStateException("""
                    Đã chọn app.mail.provider=brevo nhưng chưa có khoá API.

                    Đặt biến môi trường BREVO_API_KEY rồi khởi động lại.
                    Lấy khoá tại: Brevo > SMTP & API > API Keys.""");
        }

        if (senderEmail == null || senderEmail.isBlank())
        {
            throw new IllegalStateException("""
                    Đã chọn app.mail.provider=brevo nhưng chưa có địa chỉ gửi.

                    Đặt biến môi trường MAIL_FROM_EMAIL rồi khởi động lại.
                    Địa chỉ này phải được XÁC MINH sẵn trong Brevo (Senders & IPs >
                    Senders), nếu không Brevo từ chối mọi lần gửi.""");
        }

        this.senderEmail = senderEmail;
        this.senderName = senderName;
        // Dựng thẳng bằng RestClient.builder() thay vì nhận RestClient.Builder
        // qua constructor: bean đó không phải lúc nào cũng có sẵn, mà ở đây chỉ
        // gọi đúng một API bên ngoài nên cũng chẳng cần cấu hình dùng chung.
        this.restClient = RestClient.builder()
                .baseUrl(ENDPOINT)
                .defaultHeader("api-key", apiKey)
                .defaultHeader("accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public void sendOtp(String toEmail, String otp)
    {
        Map<String, Object> payload = Map.of(
                "sender", Map.of("name", senderName, "email", senderEmail),
                "to", List.of(Map.of("email", toEmail)),
                "subject", OtpEmailTemplate.SUBJECT,
                "textContent", OtpEmailTemplate.body(otp));

        try
        {
            restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

        } catch (RestClientResponseException e)
        {
            // Ghi lại nguyên văn phản hồi: Brevo nói rõ lý do (khoá sai, địa chỉ
            // gửi chưa xác minh, hết hạn mức ngày), mà những thứ đó không nên
            // hiện ra cho người dùng cuối.
            log.error("Brevo từ chối gửi OTP tới {} — HTTP {}: {}",
                    toEmail, e.getStatusCode().value(), e.getResponseBodyAsString());

            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không gửi được email lúc này. Vui lòng thử lại sau ít phút.");

        } catch (RestClientException e)
        {
            log.error("Không gọi được Brevo để gửi OTP tới {}", toEmail, e);

            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không gửi được email lúc này. Vui lòng thử lại sau ít phút.");
        }
    }
}
