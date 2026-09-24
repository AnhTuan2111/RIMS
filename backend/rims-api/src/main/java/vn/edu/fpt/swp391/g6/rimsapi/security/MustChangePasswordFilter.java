package vn.edu.fpt.swp391.g6.rimsapi.security;

import java.io.IOException;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Khoá hệ thống lại với tài khoản chưa đổi mật khẩu được cấp.
 *
 * <p>Tài khoản mới tạo và tài khoản vừa được Quản trị viên đặt lại đều mang mật
 * khẩu do người khác biết. Frontend đã giữ họ ở màn đổi mật khẩu, nhưng đó chỉ
 * là giao diện: token họ cầm là token hợp lệ, gọi thẳng API vẫn chạy. Filter này
 * mới là chỗ thực sự chặn.
 *
 * <p>Danh sách cho qua chỉ gồm những gì cần để đổi được mật khẩu rồi thoát ra:
 * xem hồ sơ của chính mình, đổi mật khẩu, làm mới token và đăng xuất. Các
 * endpoint công khai không đi qua đây vì chúng không có người dùng đăng nhập.
 *
 * <p>Đổi mật khẩu xong thì người dùng phải đăng nhập lại — token mới sinh ra
 * mới hết cờ. Làm vậy để không phải truy vấn CSDL ở mọi request chỉ để kiểm tra
 * một trạng thái hiếm khi đổi.
 */
@Component
public class MustChangePasswordFilter extends OncePerRequestFilter
{
    /**
     * Các đường dẫn cho qua kèm phương thức.
     *
     * <p>Ghi cả phương thức để {@code PUT /rims/me/profile} không lọt: người
     * chưa đổi mật khẩu thì cũng chưa nên sửa hồ sơ.
     */
    private static final Set<String> ALLOWED = Set.of(
            "GET /rims/me/profile",
            "POST /rims/me/change-password",
            "POST /rims/auth/logout",
            "POST /rims/auth/refresh");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException
    {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.getPrincipal() instanceof UserPrincipal principal
                && principal.isMustChangePassword()
                && !ALLOWED.contains(request.getMethod() + " " + request.getRequestURI()))
        {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("""
                    {"error":"Cần đổi mật khẩu",\
                    "message":"Tài khoản đang dùng mật khẩu do người khác đặt. \
                    Hãy đổi mật khẩu trước khi tiếp tục.",\
                    "mustChangePassword":true,"status":403}""");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
