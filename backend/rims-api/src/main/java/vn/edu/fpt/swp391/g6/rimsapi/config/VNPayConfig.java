package vn.edu.fpt.swp391.g6.rimsapi.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@Getter // Lombok tự tạo các hàm getVnpUrl(), getVnpTmnCode() để Service gọi đến
public class VNPayConfig
{
    // Spring Boot sẽ tự động vào file application.yaml đọc dữ liệu nạp vào đây
    @Value("${vnpay.url}")
    private String vnpUrl;

    @Value("${vnpay.tmn-code}")
    private String vnpTmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnpHashSecret;

    @Value("${vnpay.version}")
    private String vnpVersion;

    @Value("${vnpay.command}")
    private String vnpCommand;

    // Đường dẫn callback của bạn (có thể để static hoặc đưa ra yaml tùy bạn)
    public static final String VNP_RETURN_URL = "http://localhost:8080/rims/cashier/payments/vnpay-callback";

    public String hmacSHA512(final String key, final String data)
    {
        try
        {
            if (key == null || data == null) return null;
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result)
            {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex)
        {
            return "";
        }
    }

    public String getIpAddress(HttpServletRequest request)
    {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null)
        {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }
}