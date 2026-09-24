package vn.edu.fpt.swp391.g6.rimsapi.util;

/**
 * Giá trị mặc định khi tạo tài khoản mới.
 */
public final class AccountDefaults
{

    /**
     * Mật khẩu cấp cho tài khoản vừa tạo và cho tài khoản vừa được đặt lại.
     *
     * <p>Chuỗi này từng được gõ thẳng ở bốn chỗ, nên đổi một nơi mà quên ba nơi
     * kia thì người dùng mới không đăng nhập được.
     *
     * <p>Tài khoản nhận mật khẩu này được bật cờ
     * {@code User.mustChangePassword}. Chừng nào chủ tài khoản chưa tự đổi,
     * backend chỉ cho họ gọi đúng vài endpoint cần thiết cho việc đổi mật
     * khẩu, còn frontend giữ họ ở màn đổi mật khẩu.
     */
    public static final String DEFAULT_PASSWORD = "123456";

    private AccountDefaults()
    {
    }
}
