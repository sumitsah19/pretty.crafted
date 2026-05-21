package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.PasswordResetToken;
import com.prettycrafted.giftbox.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUser(User user);
}
