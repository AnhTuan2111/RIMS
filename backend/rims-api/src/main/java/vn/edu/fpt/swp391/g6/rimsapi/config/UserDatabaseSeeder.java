package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;

@Component
@Order(2)
@RequiredArgsConstructor
public class UserDatabaseSeeder implements CommandLineRunner
{
    private static final String DEFAULT_PASSWORD = "123456";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args)
    {
        if (userRepository.count() == 0)
        {
            seedUser("admin", "Quản trị viên", "admin@rims.local", "0900000001", RoleType.ADMIN);
            seedUser("chef", "Đầu bếp", "chef@rims.local", "0900000002", RoleType.CHEF);
            seedUser("waiter", "Phục vụ", "waiter@rims.local", "0900000003", RoleType.WAITER);
            seedUser("cashier", "Thu ngân", "cashier@rims.local", "0900000004", RoleType.CASHIER);
        }
    }

    private void seedUser(String username, String fullName, String email, String phone, RoleType role)
    {
        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setActive(true);
        userRepository.save(user);
    }
}
