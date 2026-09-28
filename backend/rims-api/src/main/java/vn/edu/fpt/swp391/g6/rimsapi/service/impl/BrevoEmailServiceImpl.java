package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import java.util.List;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import vn.edu.fpt.swp391.g6.rimsapi.service.EmailService;

/**
 * Gửi email OTP qua HTTP API của Brevo.
 *
 * <p>VÌ SAO KHÔNG DÙNG SMTP: các nền tảng lưu trữ miễn phí chặn traffic đi ra ở
 * cổng 25, 465 và 587 để máy chủ của họ không bị dùng làm nơi phát tán thư rác
 * — Render nói rõ điều này cho gói free. Ở đó {@code JavaMailSender} không phải
 * chạy chậm hay chập chờn, mà <b>không bao giờ kết nối được</b>. Và hỏng đúng
 * vào luồng quên mật khẩu, tức là thứ người dùng chỉ tìm đến khi đã không vào
 * được tài khoản.
 *
 * <p>API này chỉ là một request HTTPS tới cổng 443 — thứ không nền tảng nào
 * chặn, vì chặn nó là chặn luôn cả web.
 *
 * <p>Trước đây dự án có thêm một bản cài đặt chạy SMTP qua Gmail cho môi trường
 * phát triển, chọn bằng {@code app.mail.provider}. Đã bỏ: giữ hai đường nghĩa
 * là test ở máy một đường rồi deploy bằng một đường khác, nên luồng thật sự
 * chạy trên máy chủ lại là luồng chưa ai thử. Giờ chỉ còn một đường duy nhất.
 *
 * <p>Gói miễn phí của Brevo cho 300 thư/ngày và cho phép xác minh địa chỉ gửi
 * bằng mã 6 số gửi vào chính hộp thư đó, nên không cần sở hữu tên miền.
 */
@Service
@Slf4j
public class BrevoEmailServiceImpl implements EmailService
{

    private static final String ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private static final String TIEU_DE = "[RIMS] Mã OTP đặt lại mật khẩu";

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
                    Chưa có khoá API để gửi email.

                    Đặt biến môi trường BREVO_API_KEY rồi khởi động lại.
                    Lấy khoá tại: Brevo > SMTP & API > API Keys.

                    Ứng dụng gửi email qua HTTP API chứ không qua SMTP, vì nhiều
                    nền tảng lưu trữ chặn cổng SMTP đi ra.""");
        }

        if (senderEmail == null || senderEmail.isBlank())
        {
            throw new IllegalStateException("""
                    Chưa có địa chỉ email đứng tên gửi.

                    Đặt biến môi trường MAIL_FROM_EMAIL rồi khởi động lại.
                    Địa chỉ này phải được XÁC MINH sẵn trong Brevo (Senders,
                    Domains & Dedicated IPs > Senders), nếu không Brevo từ chối
                    mọi lần gửi.""");
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
                "subject", TIEU_DE,
                "textContent", noiDung(otp));

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

    private static String noiDung(String otp)
    {
        return "Xin chào,\n\n"
                + "Mã OTP của bạn để đặt lại mật khẩu là: " + otp + "\n\n"
                + "Mã có hiệu lực trong 5 phút.\n\n"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n"
                + "Trân trọng,\nRIMS System";
    }
}
