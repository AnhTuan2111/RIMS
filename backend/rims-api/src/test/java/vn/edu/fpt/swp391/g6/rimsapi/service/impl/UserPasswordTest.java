package vn.edu.fpt.swp391.g6.rimsapi.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import vn.edu.fpt.swp391.g6.rimsapi.dto.request.user.ChangePasswordRequest;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.exception.BusinessRuleException;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;
import vn.edu.fpt.swp391.g6.rimsapi.security.UserPrincipal;
import vn.edu.fpt.swp391.g6.rimsapi.util.AccountDefaults;

/**
 * Quy tắc mật khẩu.
 *
 * <p>Dùng BCrypt thật chứ không giả lập, vì điều đang kiểm chính là việc so
 * khớp mật khẩu — giả lập phần đó thì test không còn chứng minh gì.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Mật khẩu tài khoản")
class UserPasswordTest
{

    @Mock
    private UserRepository userRepository;

    @Spy
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Cố tình KHÔNG phải giá trị mặc định trong application.yaml. Nếu để đúng
     * chuỗi mặc định thì bài kiểm thử vẫn xanh kể cả khi mã nguồn quay lại gõ
     * cứng mật khẩu — thứ cần kiểm là service đọc từ cấu hình, không phải là
     * nó tình cờ trùng chuỗi nào đó.
     */
    private static final String MAT_KHAU_CAP_PHAT = "mat-khau-tu-cau-hinh";

    @Spy
    private AccountDefaults accountDefaults = new AccountDefaults();

    @InjectMocks
    private UserServiceImpl service;

    private User user;

    @BeforeEach
    void setUp()
    {
        user = new User();
        user.setId(5);
        user.setRole(RoleType.CUSTOMER);
        user.setUsername("customer2");
        user.setPasswordHash(passwordEncoder.encode("matkhaucu"));

        ReflectionTestUtils.setField(accountDefaults, "defaultPassword", MAT_KHAU_CAP_PHAT);

        lenient().when(userRepository.findById(5)).thenReturn(Optional.of(user));
        lenient().when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static ChangePasswordRequest doi(String cu, String moi)
    {
        return ChangePasswordRequest.builder()
                .currentPassword(cu)
                .newPassword(moi)
                .build();
    }

    private UserPrincipal principal()
    {
        return new UserPrincipal(5, "customer2", RoleType.CUSTOMER, false);
    }

    @Nested
    @DisplayName("Tự đổi mật khẩu")
    class ChangePassword
    {

        @Test
        @DisplayName("đúng mật khẩu cũ thì đổi được")
        void dungMatKhauCuThiDoiDuoc()
        {
            service.changePassword(principal(), doi("matkhaucu", "matkhaumoi"));

            assertThat(passwordEncoder.matches("matkhaumoi", user.getPasswordHash())).isTrue();
        }

        @Test
        @DisplayName("sai mật khẩu cũ thì từ chối")
        void saiMatKhauCuThiTuChoi()
        {
            assertThatThrownBy(() -> service.changePassword(principal(), doi("sai", "matkhaumoi")))
                    .isInstanceOf(BadCredentialsException.class);

            assertThat(passwordEncoder.matches("matkhaucu", user.getPasswordHash())).isTrue();
        }

        @Test
        @DisplayName("mật khẩu mới trùng mật khẩu cũ thì từ chối")
        void trungMatKhauCuThiTuChoi()
        {
            // SRS UC-AU-04 BR5. Trước đây gõ lại đúng mật khẩu cũ vẫn báo thành
            // công, nên người dùng tưởng đã đổi trong khi không có gì thay đổi.
            assertThatThrownBy(
                    () -> service.changePassword(principal(), doi("matkhaucu", "matkhaucu")))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("khác mật khẩu hiện tại");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Quản trị viên đặt lại mật khẩu")
    class ResetPassword
    {

        @Test
        @DisplayName("đặt tài khoản nhân viên về mật khẩu mặc định")
        void datLaiTaiKhoanNhanVien()
        {
            user.setRole(RoleType.CHEF);
            user.setPasswordHash(passwordEncoder.encode("gi-do"));

            service.resetPassword(5);

            assertThat(passwordEncoder.matches(
                    MAT_KHAU_CAP_PHAT, user.getPasswordHash())).isTrue();
        }

        @Test
        @DisplayName("đặt lại được cho khách hàng")
        void datLaiChoKhachHang()
        {
            assertThatCode(() -> service.resetPassword(5)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("không đặt lại được tài khoản Quản trị viên")
        void khongDatLaiTaiKhoanQuanTri()
        {
            // Nếu cho phép, một quản trị viên chiếm được tài khoản của người
            // khác chỉ bằng một cú bấm.
            user.setRole(RoleType.ADMIN);
            String truoc = user.getPasswordHash();

            assertThatThrownBy(() -> service.resetPassword(5))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Quản trị viên");

            assertThat(user.getPasswordHash()).isEqualTo(truoc);
            verify(userRepository, never()).save(any());
        }
    }

    /**
     * Cờ bắt đổi mật khẩu.
     *
     * <p>Quy tắc một câu: mật khẩu do người khác đặt thì bật cờ, chính chủ đặt
     * thì tắt cờ. Chỉ cần một nhánh quên set là hoặc người dùng bị khóa vĩnh
     * viễn ở màn đổi mật khẩu, hoặc mật khẩu mặc định sống mãi.
     */
    @Nested
    @DisplayName("Cờ bắt đổi mật khẩu")
    class MustChangePassword
    {

        @Test
        @DisplayName("tự đổi mật khẩu xong thì tắt cờ")
        void tuDoiThiTatCo()
        {
            user.setMustChangePassword(true);

            service.changePassword(principal(), doi("matkhaucu", "matkhaumoi"));

            assertThat(user.isMustChangePassword()).isFalse();
        }

        @Test
        @DisplayName("đổi mật khẩu thất bại thì cờ giữ nguyên")
        void doiThatBaiThiCoGiuNguyen()
        {
            user.setMustChangePassword(true);

            assertThatThrownBy(() -> service.changePassword(principal(), doi("sai", "matkhaumoi")))
                    .isInstanceOf(BadCredentialsException.class);

            assertThat(user.isMustChangePassword()).isTrue();
        }

        @Test
        @DisplayName("Quản trị viên đặt lại thì bật cờ")
        void datLaiThiBatCo()
        {
            user.setRole(RoleType.CHEF);
            user.setMustChangePassword(false);

            service.resetPassword(5);

            assertThat(user.isMustChangePassword()).isTrue();
        }

        @Test
        @DisplayName("tài khoản cũ trong CSDL không bị bật cờ")
        void taiKhoanCuKhongBiBatCo()
        {
            // Cột mới thêm vào bảng có sẵn sẽ mang giá trị mặc định của kiểu.
            // Nếu mặc định là true thì mọi người đang dùng hệ thống bị đá sang màn
            // đổi mật khẩu ngay sau khi triển khai.
            assertThat(new User().isMustChangePassword()).isFalse();
        }
    }
}
