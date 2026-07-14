package vn.edu.fpt.swp391.g6.rimsapi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.fpt.swp391.g6.rimsapi.entity.RevokedToken;

import java.time.LocalDateTime;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String>
{
    boolean existsByJti(String jti);

    void deleteAllByExpiresAtBefore(LocalDateTime cutoff);
}
