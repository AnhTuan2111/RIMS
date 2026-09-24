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
     * <p>Người nhận phải đổi ngay ở lần đăng nhập đầu — hệ thống chưa bắt buộc
     * việc đó, nên đây vẫn là khâu dựa vào quy trình chứ không phải kỹ thuật.
     */
    public static final String DEFAULT_PASSWORD = "123456";

    private AccountDefaults()
    {
    }
}
