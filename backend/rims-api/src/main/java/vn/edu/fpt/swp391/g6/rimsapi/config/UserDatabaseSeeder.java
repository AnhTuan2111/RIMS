package vn.edu.fpt.swp391.g6.rimsapi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.fpt.swp391.g6.rimsapi.entity.User;
import vn.edu.fpt.swp391.g6.rimsapi.enums.RoleType;
import vn.edu.fpt.swp391.g6.rimsapi.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class UserDatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            List<User> users = new ArrayList<>();

            users.add(createUser("admin", "System Admin", "admin@rims.com", "0123456789", "adminpass", RoleType.ADMIN));
            users.add(createUser("waiter1", "Waiter One", "waiter1@rims.com", "0123456790", "waiterpass", RoleType.WAITER));
            users.add(createUser("cashier1", "Cashier One", "cashier1@rims.com", "0123456791", "cashierpass", RoleType.CASHIER));
            users.add(createUser("chef1", "Chef One", "chef1@rims.com", "0123456792", "chefpass", RoleType.CHEF));


            userRepository.saveAll(users);
        }
    }

    private User createUser(String username, String fullName, String email, String phone, String rawPassword, RoleType role) {
        User u = new User();
        u.setUsername(username);
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPhone(phone);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        u.setActive(true);
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());
        return u;
    }
}
