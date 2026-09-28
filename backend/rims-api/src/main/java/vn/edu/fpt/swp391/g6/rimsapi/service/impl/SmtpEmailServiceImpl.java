package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import vn.edu.fpt.swp391.g6.rimsapi.service.EmailService;

/**
 * Gửi OTP qua SMTP. Đây là đường dùng khi chạy ở máy phát triển.
 *
 * <p>KHÔNG dùng được trên nhiều nền tảng lưu trữ miễn phí: Render chặn hẳn
 * traffic đi ra ở cổng 25, 465 và 587 trên gói free, nên mọi lần gửi đều hỏng.
 * Chỗ đó dùng {@link BrevoEmailServiceImpl} — nó đi qua cổng 443 như một
 * request HTTPS bình thường nên không vướng.
 *
 * <p>Chọn đường nào là do {@code app.mail.provider} quyết định. Thiếu cấu hình
 * thì mặc định là SMTP, để môi trường phát triển giữ nguyên nếp cũ.
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp", matchIfMissing = true)
public class SmtpEmailServiceImpl implements EmailService
{

    private final JavaMailSender mailSender;

    public SmtpEmailServiceImpl(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password)
    {
        // spring.mail.username/password nhận giá trị rỗng để bản deploy dùng
        // HTTP API khởi động được mà không cần tài khoản SMTP. Nhưng khi ĐANG
        // chọn đường SMTP thì thiếu hai giá trị đó là hỏng chắc — dừng ngay ở
        // đây còn hơn để người dùng bấm "Quên mật khẩu" rồi mới nhận lỗi 503.
        if (username == null || username.isBlank() || password == null || password.isBlank())
        {
            throw new IllegalStateException("""
                    Đang gửi email qua SMTP nhưng chưa có tài khoản.

                    Đặt MAIL_USERNAME và MAIL_PASSWORD trong file .env ở gốc repo.
                    MAIL_PASSWORD là App Password 16 ký tự của Gmail, không phải
                    mật khẩu đăng nhập: https://myaccount.google.com/apppasswords

                    Hoặc chuyển sang gửi qua HTTP API bằng MAIL_PROVIDER=brevo.""");
        }

        this.mailSender = mailSender;
    }

    @Override
    public void sendOtp(String toEmail, String otp)
    {
        try
        {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(OtpEmailTemplate.SUBJECT);
            message.setText(OtpEmailTemplate.body(otp));
            mailSender.send(message);

        } catch (MailAuthenticationException e)
        {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể gửi email: cấu hình SMTP chưa đúng. Kiểm tra MAIL_USERNAME và MAIL_PASSWORD.");

        } catch (MailSendException e)
        {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Không thể gửi email đến " + toEmail + ". Vui lòng kiểm tra lại địa chỉ email.");

        } catch (Exception e)
        {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Lỗi gửi email: " + e.getMessage());
        }
    }
}
