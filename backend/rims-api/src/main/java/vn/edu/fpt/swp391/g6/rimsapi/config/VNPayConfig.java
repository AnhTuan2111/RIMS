package vn.edu.fpt.swp391.g6.rimsapi.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;


@Configuration
public class VNPayConfig
{
    public static final String vnp_PayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    public static final String vnp_ReturnUrl = "http://localhost:8080/api/cashier/payments/vnpay-callback";
    public static final String vnp_TmnCode = "3M78B7N6"; // Mã test giả lập
    public static final String vnp_HashSecret = "Y9E8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4"; // Chuỗi bí mật test
    public static final String vnp_Version = "2.1.0";
    public static final String vnp_Command = "pay";

    public static String hmacSHA512(final String key, final String data)
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

    public static String getIpAddress(HttpServletRequest request)
    {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null)
        {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }
}