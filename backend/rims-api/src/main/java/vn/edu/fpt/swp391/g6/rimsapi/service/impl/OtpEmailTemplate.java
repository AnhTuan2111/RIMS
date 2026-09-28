package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

/**
 * Nội dung email OTP, dùng chung cho cả hai đường gửi (SMTP và HTTP API).
 *
 * <p>Để riêng ra vì nếu chép đôi thì sớm muộn sửa một bên quên bên kia, và
 * người dùng nhận được hai lời nhắn khác nhau tuỳ môi trường đang chạy.
 */
final class OtpEmailTemplate
{

    static final String SUBJECT = "[RIMS] Mã OTP đặt lại mật khẩu";

    private OtpEmailTemplate()
    {
    }

    static String body(String otp)
    {
        return "Xin chào,\n\n"
                + "Mã OTP của bạn để đặt lại mật khẩu là: " + otp + "\n\n"
                + "Mã có hiệu lực trong 5 phút.\n\n"
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n"
                + "Trân trọng,\nRIMS System";
    }
}
