package vn.edu.fpt.swp391.g6.rimsapi.util;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Giá trị mặc định khi tạo tài khoản mới.
 *
 * <p>Trước đây là một hằng số {@code static final} gõ thẳng chuỗi trong mã
 * nguồn, nên mọi bản cài đặt của app này đều dùng chung một mật khẩu, và ai
 * đọc repo cũng biết nó. Đổi thì phải build lại.
 *
 * <p>Giờ đọc từ cấu hình, đặt được qua biến môi trường
 * {@code RIMS_DEFAULT_PASSWORD}. Giá trị mặc định vẫn giữ nguyên như cũ để
 * bản cài đặt đang chạy không gãy khi cập nhật — nhưng nó là một giá trị
 * <b>cần đổi</b>, không phải một giá trị dùng được.
 */
@Component
@Getter
public class AccountDefaults
{

    /**
     * Mật khẩu cấp cho tài khoản vừa tạo và cho tài khoản vừa được đặt lại.
     *
     * <p>Tài khoản nhận mật khẩu này được bật cờ
     * {@code User.mustChangePassword}. Chừng nào chủ tài khoản chưa tự đổi,
     * backend chỉ cho họ gọi đúng vài endpoint cần thiết cho việc đổi mật
     * khẩu, còn frontend giữ họ ở màn đổi mật khẩu.
     */
    @Value("${app.account.default-password:123456}")
    private String defaultPassword;
}
